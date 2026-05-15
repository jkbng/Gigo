const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const pdfParse  = require("pdf-parse");
const Anthropic = require("@anthropic-ai/sdk");
const Job       = require("../models/Job");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "application/pdf" ||
               file.mimetype === "text/plain" ||
               file.originalname.toLowerCase().endsWith(".pdf") ||
               file.originalname.toLowerCase().endsWith(".txt");
    ok ? cb(null, true) : cb(new Error("Only PDF and TXT files are supported"));
  },
});

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

router.post("/parse-and-match", (req, res) => {
  upload.single("resume")(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No resume file received. Field name must be 'resume'." });
      }

      // 1. Extract text
      let resumeText = "";
      const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        try {
          const parsed = await pdfParse(req.file.buffer);
          resumeText = parsed.text;
        } catch {
          return res.status(400).json({ success: false, message: "Could not parse PDF. Try a TXT file instead." });
        }
      } else {
        resumeText = req.file.buffer.toString("utf-8");
      }

      if (!resumeText.trim()) {
        return res.status(400).json({ success: false, message: "Resume appears empty or unreadable." });
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      // 2. Extract profile
      const profileMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `Extract from this resume. Respond ONLY with a JSON object, no markdown:
{"name":"candidate name","skills":["skill1"],"experience_years":3,"roles":["title"],"education":"degree","summary":"2-sentence summary"}

Resume:
${resumeText.slice(0, 4000)}`,
        }],
      });

      let profile = {};
      try {
        profile = JSON.parse(profileMsg.content[0].text.replace(/```json|```/g, "").trim());
      } catch {
        profile = { name:"Unknown", skills:[], roles:[], experience_years:0, education:"", summary:"Professional candidate" };
      }

      // 3. Fetch jobs
      const { lat, lng } = req.query;
      const jobQuery = lat && lng
        ? { isActive:true, location:{ $near:{ $geometry:{ type:"Point", coordinates:[+lng,+lat] }, $maxDistance:20000 } } }
        : { isActive: true };
      const allJobs = await Job.find(jobQuery).limit(100);

      if (allJobs.length === 0) {
        return res.json({ success:true, profile, matches:[], message:"No jobs in database. Seed some jobs first." });
      }

      // 4. Rank jobs
      const jobList = allJobs.map((j,i) => ({ index:i, id:j._id.toString(), title:j.title, company:j.company, tags:j.tags||[], type:j.type }));

      const rankMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Candidate: Skills: ${profile.skills?.join(", ")} | Roles: ${profile.roles?.join(", ")} | ${profile.experience_years} yrs exp

Rank ALL these jobs by fit. Respond ONLY with a JSON array, no markdown:
[{"id":"<_id>","matchScore":92,"reason":"1 sentence"}]

Jobs: ${JSON.stringify(jobList)}`,
        }],
      });

      let ranked = [];
      try {
        ranked = JSON.parse(rankMsg.content[0].text.replace(/```json|```/g, "").trim());
      } catch {
        ranked = allJobs.map(j => ({ id:j._id.toString(), matchScore:50, reason:"Potential match" }));
      }

      // 5. Merge & sort
      const jobMap = Object.fromEntries(allJobs.map(j => [j._id.toString(), j]));
      const matches = ranked
        .filter(r => jobMap[r.id])
        .map(r => {
          const job = jobMap[r.id];
          const [jLng,jLat] = job.location.coordinates;
          return {
            ...job.toObject(),
            matchScore: r.matchScore,
            matchReason: r.reason,
            distanceKm: lat && lng ? +distKm(+lat,+lng,jLat,jLng).toFixed(2) : null,
          };
        })
        .sort((a,b) => b.matchScore - a.matchScore);

      res.json({ success:true, profile, matches });
    } catch (err) {
      console.error("Resume error:", err);
      res.status(500).json({ success:false, message: err.message || "Server error" });
    }
  });
});

module.exports = router;

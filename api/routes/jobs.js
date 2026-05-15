const express = require("express");
const router  = express.Router();
const Job     = require("../models/Job");

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng required" });
    const jobs = await Job.find({
      isActive: true,
      location: { $near: { $geometry: { type:"Point", coordinates:[+lng,+lat] }, $maxDistance: +radius } },
    }).limit(50);
    const result = jobs.map(j => {
      const [jLng,jLat] = j.location.coordinates;
      return { ...j.toObject(), distanceKm: +distKm(+lat,+lng,jLat,jLng).toFixed(2) };
    });
    res.json({ success: true, count: result.length, jobs: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, job });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post("/seed", async (req, res) => {
  try {
    const { lat = 17.385, lng = 78.486 } = req.body;
    await Job.insertMany([
      { title:"React Developer",   company:"TechCorp",   type:"Full-time",  salary:"₹8–12 LPA",  tags:["React","JavaScript","Node.js"],   location:{ type:"Point", coordinates:[lng+0.01, lat+0.01], address:"Hitech City" } },
      { title:"UI/UX Designer",    company:"DesignHub",  type:"Contract",   salary:"₹50k/mo",    tags:["Figma","Sketch","CSS"],            location:{ type:"Point", coordinates:[lng-0.01, lat+0.005], address:"Banjara Hills" } },
      { title:"Data Analyst",      company:"DataFirst",  type:"Full-time",  salary:"₹6–9 LPA",   tags:["Python","SQL","Excel"],            location:{ type:"Point", coordinates:[lng+0.02, lat-0.01], address:"Gachibowli" } },
      { title:"DevOps Engineer",   company:"CloudBase",  type:"Remote",     salary:"₹10–15 LPA", tags:["AWS","Docker","Kubernetes"],       location:{ type:"Point", coordinates:[lng, lat],            address:"Remote" } },
      { title:"Content Writer",    company:"MediaPro",   type:"Part-time",  salary:"₹25k/mo",    tags:["SEO","Blogging","Copywriting"],    location:{ type:"Point", coordinates:[lng+0.015, lat+0.02], address:"Kondapur" } },
    ]);
    res.json({ success: true, message: "Seeded 5 jobs" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

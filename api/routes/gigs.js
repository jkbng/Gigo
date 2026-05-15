const express = require("express");
const router  = express.Router();
const Gig     = require("../models/Gig");

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng required" });
    const now = new Date();
    const gigs = await Gig.find({
      isActive: true, expiresAt: { $gt: now }, slotsRemaining: { $gt: 0 },
      location: { $near: { $geometry: { type:"Point", coordinates:[+lng,+lat] }, $maxDistance: +radius } },
    }).limit(30);
    const result = gigs.map(g => {
      const [gLng,gLat] = g.location.coordinates;
      return { ...g.toObject(), distanceKm: +distKm(+lat,+lng,gLat,gLng).toFixed(2), expiresInHours: +((g.expiresAt - now)/3600000).toFixed(1) };
    });
    res.json({ success: true, count: result.length, gigs: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const gigs = await Gig.find({ isActive: true, expiresAt: { $gt: now } }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: gigs.length, gigs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const gig = await Gig.create(req.body);
    res.status(201).json({ success: true, gig });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post("/:id/apply", async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (gig.slotsRemaining <= 0) return res.status(400).json({ success: false, message: "No slots remaining" });
    gig.slotsRemaining -= 1;
    if (gig.slotsRemaining === 0) gig.isActive = false;
    await gig.save();
    res.json({ success: true, slotsRemaining: gig.slotsRemaining });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/seed", async (req, res) => {
  try {
    const { lat = 17.385, lng = 78.486 } = req.body;
    const tomorrow = new Date(); tomorrow.setHours(23,59,59,999);
    await Gig.insertMany([
      { title:"Delivery Partner – Swiggy Rush", category:"Delivery", company:"Swiggy",          pay:"₹600", payType:"daily", duration:"6 hrs",  slots:5,  slotsRemaining:3, requirements:["Own bike","Smartphone","DL"],          expiresAt:tomorrow, location:{ type:"Point", coordinates:[lng+0.008, lat+0.005], address:"Hitech City" } },
      { title:"Event Setup Crew",               category:"Event",    company:"EventPro",         pay:"₹900", payType:"daily", duration:"1 day",  slots:8,  slotsRemaining:5, requirements:["Physical fitness"],                    expiresAt:tomorrow, location:{ type:"Point", coordinates:[lng-0.01,  lat+0.012], address:"Banjara Hills" } },
      { title:"Office Deep Cleaning",           category:"Cleaning", company:"CleanPro Services",pay:"₹450", payType:"daily", duration:"4 hrs",  slots:3,  slotsRemaining:1, requirements:["Experience preferred"],               expiresAt:tomorrow, location:{ type:"Point", coordinates:[lng+0.02,  lat-0.008], address:"Gachibowli" } },
      { title:"Data Entry – WFH",               category:"Tech",     company:"DataFirst",        pay:"₹300", payType:"daily", duration:"3 hrs",  slots:10, slotsRemaining:7, requirements:["Laptop","Typing 40 WPM"],              expiresAt:tomorrow, location:{ type:"Point", coordinates:[lng,       lat],       address:"Remote / Any" } },
      { title:"Movers & Packers Helper",        category:"Moving",   company:"QuickMove",        pay:"₹800", payType:"daily", duration:"8 hrs",  slots:4,  slotsRemaining:4, requirements:["Physical strength"],                  expiresAt:tomorrow, location:{ type:"Point", coordinates:[lng+0.015, lat+0.02],  address:"Kondapur" } },
    ]);
    res.json({ success: true, message: "Seeded 5 gigs" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

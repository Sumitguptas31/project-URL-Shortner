const express = require('express');
const router = express.Router();
const Controller = require("../Controllers/UrlController")



router.post("/Url/shorten",Controller.ShortingUrl)

router.get("/:urlCode",Controller.getingdata)




module.exports= router;
const UrlModel = require("../Models/UrlModel");
const mongoose = require('mongoose')
const shortid = require('shortid')
const redis= require('redis')
const {promisify}= require('util')

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const redisClient = redis.createClient(
    16368,
    "redis-16368.c15.us-east-1-2.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("Y52LH5DG1XbiVCkNC2G65MvOFswvQCRQ", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const ShortingUrl = async function (req, res) {
    try {
        const data = req.body
        const { longUrl } = data
        const baseurl = 'http://localhost:3000'

        // if (!ValidURL.isUri(baseurl)) {
        //     return res.status(401).send({ status: false, msg: 'Invalid base URL' })
        // }

        const urlCode = shortid.generate()
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, msg: "Please enter Long url" })
        }
        if (!/^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(longUrl.trim())) {

            return res.status(400).send({ status: false, message: "please provide valid URL" })
         }
      

        const longUrlData= await UrlModel.findOne({ longUrl: longUrl })

        if (isValid(longUrlData)) {
            return res.status(201).send({ status: true, data: longUrlData })
        }
        else {


            const shortUrl = baseurl + '/' + urlCode
   
            
        
            const result = await UrlModel.create({ longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode })
           
            //await SET_ASYNC(urlCode.toLowerCase(), longUrl)
            await SET_ASYNC('longUrl',JSON.stringify(longUrl))
            await SET_ASYNC('shortUrl',JSON.stringify(shortUrl))
            await SET_ASYNC('urlCode',JSON.stringify(urlCode))
           return res.status(201).send({ status: true, msg: "Data created sucessfully", data: result })
        }

    } catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}




const getingdata = async function (req, res) {
    try {
        const urlData= req.params.urlCode
        const getdata= await GET_ASYNC('${urlData}')

        if (getdata) {
            // when valid we perform a redirect
            return res.status(200).redirect(urlData.longUrl)
        } else {
            // else return a not found 404 status
          let data= await UrlModel.findOne({urlCode:urlData})
          if(!data){
              res.status(404).send({status:false,msg:"invalid request"})
          }
           await SET_ASYNC('${req.params.urlCode}',JSON.stringify(data.longUrl))
          res.status(201).redirect(data.longUrl)
        }
    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
}








module.exports.ShortingUrl = ShortingUrl
module.exports.getingdata = getingdata

import {File} from "../models/file.models.js";
import express from "express";
const router = express.Router();

router.get('/:uuid',async(req,res)=>{
    try{
        const file=await File.findOne({uuid:req.params.uuid});
        if(!file){
            return res.render('downnload',{error:"Link has been expired"});
        }
        return res.render('download',{
            uuid:file.uuid,
            fileName:file.filename,
            fileSize:file.size,
            downloadLink:`${process.env.APP_BASE_URL}/files/download/${file.uuid}`
        });
    }catch(err){
        return res.render('download',{error:"Something went wrong"});
    }
})

export default router;
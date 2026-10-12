const {logger} = require('../utils/logger');
const {search} = require('../models/search');

const searchPostController = async(req, res)=> {
    try{
        logger.info("search endpoint hit...");
        const {query} = req.query;
        const results = await search.find(
            {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
        ).sort({score:{$meta: "textScore"}}).limit(10);
        res.json(results);
    }catch(error){
        logger.error("Search controller error", error);
        return res.status(500).json({
            success: false,
            message :"Internal server error",
        })
    }
}

module.exports = {searchPostController};
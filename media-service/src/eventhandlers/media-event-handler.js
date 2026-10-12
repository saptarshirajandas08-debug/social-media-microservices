const {logger} = require('../utils/logger');
const {media} = require('../models/media');
const {deleteMediaFromCloudinary} = require('../utils/cloudinary');

const handlePostDeleted = async (event) => {
  console.log(event, "eventeventevent");
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await media.find({ _id: { $in: mediaIds } });

      for (const mediaItem of mediaToDelete) {
      await deleteMediaFromCloudinary(mediaItem.publicId);
      await media.findByIdAndDelete(mediaItem._id);

      logger.info(
        `Deleted medua ${media._id} associated with this deleted post ${postId}`
      );
    }

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error(e, "Error occured while media deletion");
  }
};

module.exports = {handlePostDeleted};
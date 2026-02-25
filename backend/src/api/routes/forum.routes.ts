import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { ForumController } from "../controllers/forum.controller";
import { ForumService } from "../../business/forum.service";
import { ForumRepository } from "../../repositories/forum.repository";
import { getDb } from '../../db/init';

const router = Router()
// Apply authentication to all forum routes
router.use(requireAuth);

// Lazy-initialize controller to avoid calling getDb during module load
let cartController: ForumController | null = null;
function getController(): ForumController {
  if (!cartController) {
    const forumService = new ForumService(getDb());
    cartController = new ForumController(forumService);
  }
  return cartController;
}


router.get('/discussions', async (req, res, next) => {
  getController().getForum(req, res, next) //Forum === multiple discussions
})

router.get('/discussion', async (req, res, next) => {
  getController().getDiscussionById(req, res, next) //Forum === multiple discussions
})

router.get('/comments', async (req, res, next) => {
  getController().getMessages(req, res, next)
})

router.post('/discussions', async (req, res, next) => {
  getController().createDiscussion(req, res, next)
})

router.post('/comments', async (req, res, next) => {
  getController().createComment(req, res, next)
})

router.patch('/discussions', async (req, res, next) => {
  getController().changeDiscussion(req, res, next)
})

router.patch('/comments', async (req, res, next) => {
  getController().changeComment(req, res, next)
})


export default router
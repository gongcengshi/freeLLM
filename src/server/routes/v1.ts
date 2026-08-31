import { Router, type Request, type Response } from 'express';
import { chatService } from '../../services/chat.js';
import { ChatRequestSchema } from '../../types/index.js';
import type { RoutingStrategy } from '../../types/index.js';

const router = Router();

router.post('/chat/completions', async (req: Request, res: Response) => {
  try {
    const validationResult = ChatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          message: 'Invalid request body',
          type: 'invalid_request_error',
          details: validationResult.error.errors,
        },
      });
      return;
    }

    const request = validationResult.data;
    const strategy = req.headers['x-freellm-strategy'] as RoutingStrategy | undefined;

    if (request.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        for await (const chunk of chatService.streamChatCompletion(request, strategy)) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        res.write(`data: ${JSON.stringify({ error: { message: errorMessage } })}\n\n`);
        res.end();
      }
    } else {
      const response = await chatService.chatCompletion(request, strategy);
      res.json(response);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('429') ? 429 :
                      errorMessage.includes('401') ? 401 :
                      errorMessage.includes('403') ? 403 :
                      errorMessage.includes('No available providers') ? 404 : 500;

    res.status(statusCode).json({
      error: {
        message: errorMessage,
        type: 'server_error',
      },
    });
  }
});

export default router;

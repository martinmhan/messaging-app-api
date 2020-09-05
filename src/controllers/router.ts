import { Router, Request, Response } from 'express'

const router = Router()

router.get('/test', (req: Request, res: Response) => {
  const responseTestData = { someData: 'hello world' }
  res.status(200).send(responseTestData)
})

export default router

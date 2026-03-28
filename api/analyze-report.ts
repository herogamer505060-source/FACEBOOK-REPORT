import { analyzeReportPayload, formatApiError } from '../server/report-analysis.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const result = await analyzeReportPayload(req.body);
    res.status(200).json(result);
  } catch (error) {
    const { statusCode, message } = formatApiError(error);
    res.status(statusCode).json({ error: message });
  }
}

import { generateText } from 'ai';
import { pathToFileURL } from 'node:url';

export async function generateHoliday(
  generateTextFn: typeof generateText = generateText,
) {
  const { text } = await generateTextFn({
    model: 'moonshotai/kimi-k3',
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  if (!text.trim()) {
    throw new Error('The model returned an empty response.');
  }

  return text;
}

async function main() {
  const text = await generateHoliday();
  process.stdout.write(`${text}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    process.stderr.write(
      'Missing AI_GATEWAY_API_KEY. Set it in .env.local before running this example.\n',
    );
    process.exitCode = 1;
  } else {
    main().catch((error: unknown) => {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number'
          ? ` (HTTP ${error.statusCode})`
          : '';

      process.stderr.write(
        `AI Gateway request failed${statusCode}. Check key access and account billing.\n`,
      );
      process.exitCode = 1;
    });
  }
}

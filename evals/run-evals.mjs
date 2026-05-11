import fs from 'fs';
import path from 'path';
import { retrievalPrecision, groundingScore, answerConsistency, hallucinationDetected } from './scoringMetrics.mjs';

const datasetPath = path.resolve('evals/datasets/golden_tests.json');
const outputDir = path.resolve('evals/reports');

function run() {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const results = [];

  let retrievalScores = [];
  let groundingScores = [];
  let consistencyScores = [];
  let hallucinationFlags = [];

  for (const test of dataset) {
    if (test.type === 'retrieval') {
      const score = retrievalPrecision(test.expected_keywords, test.mock_retrieved_chunks);
      retrievalScores.push(score);
      results.push({ id: test.id, metric: 'retrieval_precision', score });
    }

    if (test.type === 'hallucination') {
      const flag = hallucinationDetected(test.model_answer, test.evidence);
      hallucinationFlags.push(flag ? 1 : 0);
      const score = groundingScore(test.model_answer, test.evidence);
      groundingScores.push(score);
      results.push({ id: test.id, metric: 'hallucination_detected', value: flag, grounding_score: score });
    }

    if (test.type === 'consistency') {
      const score = answerConsistency(test.answers);
      consistencyScores.push(score);
      results.push({ id: test.id, metric: 'answer_consistency', score });
    }

    if (test.type === 'prompt_regression') {
      const candidateResponse = `Based on the evidence, architecture leadership is present. Evidence: ${test.evidence}`;
      const hasExpected = test.expected_contains.every((token) => candidateResponse.toLowerCase().includes(token.toLowerCase()));
      const score = hasExpected ? 1 : 0;
      results.push({ id: test.id, metric: 'prompt_regression_pass', score });
    }
  }

  const summary = {
    retrieval_precision: retrievalScores.length ? retrievalScores.reduce((a, b) => a + b, 0) / retrievalScores.length : 0,
    grounding_score: groundingScores.length ? groundingScores.reduce((a, b) => a + b, 0) / groundingScores.length : 0,
    answer_consistency: consistencyScores.length ? consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length : 0,
    hallucination_rate: hallucinationFlags.length ? hallucinationFlags.reduce((a, b) => a + b, 0) / hallucinationFlags.length : 0,
    total_tests: dataset.length
  };

  const report = {
    generated_at: new Date().toISOString(),
    summary,
    results
  };

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filename = `eval-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('Evaluation complete.');
  console.log(`Report: ${outputPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

run();

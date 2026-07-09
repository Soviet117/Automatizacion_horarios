import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const { SchedulerService } = await import('../lib/schedulerService.ts');
  const result = await SchedulerService.optimizeSchedule(
    'd1eb7569-7bbf-4256-aaf9-067672dfc983',
    'esc-full-001'
  );
  console.log(JSON.stringify({ coverage: result.coverage, total: result.total_sessions_assigned }));
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());

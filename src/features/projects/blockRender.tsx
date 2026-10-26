/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ProjectBlock } from './projectModel';
import type { BlockProps } from './ui';
import { BlockText } from './blocks/BlockText';
import { BlockChecklist, BlockTasks } from './blocks/BlockTasks';
import { BlockTimeline } from './blocks/BlockTimeline';
import { BlockTeam } from './blocks/BlockTeam';
import { BlockBudget } from './blocks/BlockBudget';
import { BlockDecisions, BlockImages, BlockProsCons, BlockReminders, BlockRisks, BlockTable } from './blocks/BlockLists';
import { BlockPoll } from './blocks/BlockPoll';
import { BlockLinks } from './blocks/BlockLinks';

export function renderBlock(b: ProjectBlock, props: BlockProps<any>) {
  switch (b.kind) {
    case 'text': return <BlockText {...props} />;
    case 'tasks': return <BlockTasks {...props} />;
    case 'checklist': return <BlockChecklist {...props} />;
    case 'timeline': return <BlockTimeline {...props} />;
    case 'team': return <BlockTeam {...props} />;
    case 'budget': return <BlockBudget {...props} />;
    case 'risks': return <BlockRisks {...props} />;
    case 'decisions': return <BlockDecisions {...props} />;
    case 'poll': return <BlockPoll {...props} />;
    case 'proscons': return <BlockProsCons {...props} />;
    case 'table': return <BlockTable {...props} />;
    case 'links': return <BlockLinks {...props} />;
    case 'reminders': return <BlockReminders {...props} />;
    case 'images': return <BlockImages {...props} />;
  }
}

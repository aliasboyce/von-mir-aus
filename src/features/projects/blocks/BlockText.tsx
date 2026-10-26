import { RichTextEditor } from '../../../components/shared/RichTextEditor';
import type { TextBlock } from '../projectModel';
import type { BlockProps } from '../ui';

export function BlockText({ block, onChange, L }: BlockProps<TextBlock>) {
  return (
    <RichTextEditor
      value={block.text}
      onChange={(text) => onChange({ ...block, text })}
      placeholder={block.hint ?? L('Schreib, was du festhalten möchtest …', 'Write what you want to keep …')}
      minRows={4}
      testId={`blk-${block.id}-text`}
    />
  );
}

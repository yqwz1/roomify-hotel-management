function renderInline(text) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={`${token}-${index}`}>{token.slice(1, -1)}</code>;
    }
    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

export default function MarkdownMessage({ content }) {
  const lines = String(content || '').split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1 ps-4 text-sm leading-6">
          {listItems.map((item, index) => (
            <li key={`${item}-${index}`} className="list-disc">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${index}`} className="text-sm font-black tracking-tight break-words">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base font-black tracking-tight break-words">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm leading-6 break-words">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-2 text-brand-ink">{elements}</div>;
}

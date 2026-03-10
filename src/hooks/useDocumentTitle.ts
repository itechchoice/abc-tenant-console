import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

const DEFAULT_TITLE = 'AlphaBitCore';

export default function useDocumentTitle() {
  const matches = useMatches();

  useEffect(() => {
    const title = matches
      .filter((match) => (match.handle as { title?: string } | undefined)?.title)
      .pop();

    const pageTitle = (title?.handle as { title?: string } | undefined)?.title;
    document.title = pageTitle ? `${pageTitle} - ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [matches]);
}

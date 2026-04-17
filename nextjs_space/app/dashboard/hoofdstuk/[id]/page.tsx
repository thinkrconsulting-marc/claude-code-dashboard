import ChapterView from './_components/chapter-view';

export default function ChapterPage({ params }: { params: { id: string } }) {
  return <ChapterView chapterId={params?.id ?? ''} />;
}

export const dynamic = 'force-dynamic';
import RepoDetailPage from './_components/repo-detail-page';

export default function Page({ params }: { params: { id: string } }) {
  return <RepoDetailPage repoId={params?.id ?? ''} />;
}

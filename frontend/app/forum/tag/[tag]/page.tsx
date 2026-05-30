import ForumList from '../../ForumList';

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function ForumTagPage({ params }: Props) {
  const { tag } = await params;
  return <ForumList initialTag={decodeURIComponent(tag)} />;
}

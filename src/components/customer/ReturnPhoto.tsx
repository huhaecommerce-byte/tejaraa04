import { useReturnPhotoUrl } from '@/lib/returnPhotos';

interface Props {
  value: string;
  className?: string;
  linkable?: boolean;
}

/** Renders a return photo from the private bucket via a short-lived signed URL. */
export function ReturnPhoto({ value, className, linkable }: Props) {
  const url = useReturnPhotoUrl(value);

  if (!url) return <div className={`${className ?? ''} bg-muted animate-pulse`} />;

  const img = <img src={url} alt="Return photo" className={className} />;
  if (!linkable) return img;

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {img}
    </a>
  );
}

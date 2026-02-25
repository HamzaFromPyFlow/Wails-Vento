// Desktop version - simplified metadata helper
// Note: This is adapted from Next.js metadata - desktop apps don't use Next.js metadata

export interface MetadataProps {
    title?: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    notIndexed?: boolean;
}

export const generateGlobalMetadata = (props: MetadataProps): MetadataProps => {
    const title = props.title ?? "Vento - Stress-Free Screen Recording";
    const description = props.description ?? "Vento lets you pause, rewind a few seconds, and re-record over any mistakes so you don't have to constantly restart your recordings.";
    const imageUrl = props.imageUrl ?? "https://vento.so/assets/preview.png";
    const url = props.url ?? "https://vento.so";
    const notIndexed = props.notIndexed ?? false;
    
    return {
        title,
        description,
        imageUrl,
        url,
        notIndexed,
    };
};

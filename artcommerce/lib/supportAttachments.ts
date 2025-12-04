export type SupportAttachment = {
  url: string;
  type: 'image';
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  name?: string;
};

const isImageLike = (value?: string) => (value || '').toLowerCase().startsWith('image');

export function sanitizeSupportAttachments(raw: any): SupportAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((att) => {
      if (!att || typeof att !== 'object') return null;
      const url = typeof att.url === 'string' ? att.url : null;
      const mimeType = typeof att.mimeType === 'string' ? att.mimeType : undefined;
      const type = typeof att.type === 'string' ? att.type : '';
      const isImage = isImageLike(type) || isImageLike(mimeType);
      if (!url || !isImage) return null;

      return {
        url,
        type: 'image' as const,
        mimeType,
        size: typeof att.size === 'number' ? att.size : undefined,
        width: typeof att.width === 'number' ? att.width : undefined,
        height: typeof att.height === 'number' ? att.height : undefined,
        name: typeof att.name === 'string' ? att.name : undefined,
      };
    })
    .filter(Boolean) as SupportAttachment[];
}

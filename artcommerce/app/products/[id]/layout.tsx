import { Metadata, ResolvingMetadata } from 'next/types';

type Props = {
  children: React.ReactNode;
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch product data
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/products/${params.id}`, { 
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!res.ok) {
      return {
        title: 'Product | Kalakraft',
      };
    }
    
    const data = await res.json();
    const product = data.product;
    
    // Parse image URLs
    let imageUrls: string[] = [];
    try {
      imageUrls = Array.isArray(product.imageUrls) 
        ? product.imageUrls 
        : JSON.parse(product.imageUrls || '[]');
    } catch (e) {
      // Handle parsing error
    }
    
    // Get the first image URL if available
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
    
    return {
      title: `${product.name} | Kalakraft`,
      description: product.shortDesc || product.description || 'Explore our beautiful handcrafted products at Kalakraft',
      openGraph: {
        title: product.name,
        description: product.shortDesc || product.description || 'Explore our beautiful handcrafted products at Kalakraft',
        images: imageUrl ? [imageUrl] : [],
        type: 'website',
        siteName: 'Kalakraft',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.shortDesc || product.description || 'Explore our beautiful handcrafted products at Kalakraft',
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    // Fallback metadata if there's an error
    return {
      title: 'Product | Kalakraft',
      description: 'Explore our beautiful handcrafted products at Kalakraft',
    };
  }
}

export default function ProductPageLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}

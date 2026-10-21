/**
 * Structured data for the profile pages (the home page and /home-alternate/): one connected
 * graph where the site, the profile page and the person they are about share @ids, and
 * case-study Articles point their author at the same #person.
 */
import { getImage } from 'astro:assets';
import photo from '../assets/profile.jpg';
import { profile } from '../data/profile';

export async function profileJsonLd(site: string): Promise<object[]> {
  const personId = `${site}#person`;
  const photoUrl = new URL((await getImage({ src: photo, width: 400, format: 'jpg' })).src, site).toString();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${site}#website`,
      url: site,
      name: profile.name,
      description: `Portfolio of ${profile.name}, ${profile.role} in ${profile.location}.`,
      inLanguage: 'en-AU',
      author: { '@id': personId },
      publisher: { '@id': personId },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${site}#profilepage`,
      url: site,
      name: `${profile.name} | ${profile.role}`,
      isPartOf: { '@id': `${site}#website` },
      inLanguage: 'en-AU',
      mainEntity: {
        '@type': 'Person',
        '@id': personId,
        name: profile.name,
        jobTitle: profile.role,
        description: profile.pitch,
        url: site,
        email: `mailto:${profile.email}`,
        image: photoUrl,
        address: { '@type': 'PostalAddress', addressLocality: 'Melbourne', addressRegion: 'VIC', addressCountry: 'AU' },
        worksFor: { '@type': 'Organization', name: 'Viable Solutions' },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Manipal University Jaipur' },
        knowsAbout: ['Site Reliability Engineering', 'Amazon Web Services', 'Observability', 'Infrastructure as Code', 'Kubernetes', 'Incident management', 'AWS Bedrock', 'DevOps', 'Platform engineering', 'Cloud infrastructure', 'AI-assisted operations'],
        sameAs: [profile.linkedin, profile.github],
      },
    },
  ];
}

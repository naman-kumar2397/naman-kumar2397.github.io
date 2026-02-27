/** Centralised personal profile data — single source of truth for the identity card. */
export const profile = {
  name: "Naman Kumar",
  title: "Lead Site Reliability Engineer",
  location: "Melbourne, Australia",
  photo: "/profile.jpeg",
  initials: "NK",
  contacts: [
    {
      id: "phone" as const,
      label: "Phone",
      value: "+61 439 077 501",
      href: "tel:+61439077501",
    },
    {
      id: "email" as const,
      label: "Email",
      value: "naman.kumar2397@gmail.com",
      href: "mailto:naman.kumar2397@gmail.com",
    },
    {
      id: "linkedin" as const,
      label: "LinkedIn",
      value: "linkedin.com/in/-namankumar",
      href: "https://www.linkedin.com/in/-namankumar/",
    },
    {
      id: "calendar" as const,
      label: "Schedule meeting",
      value: "cal.com/naman-kumar-6s44m9",
      href: "https://cal.com/naman-kumar-6s44m9",
    },
  ],
} as const;

export type ContactId = (typeof profile.contacts)[number]["id"];

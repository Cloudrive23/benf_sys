import { prisma } from "@/app/lib/prisma";

export type BeneficiarySponsorLinkRow = {
  id: string;
  beneficiary_id: string;
  sponsor_id: string;
  sponsor_beneficiary_code: string | null;
  sponsor_file_number: string | null;
  sponsor_reference: string | null;
  registration_date: Date | string | null;
  status: string | null;
  notes: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  sponsor_code: string | null;
  sponsor_name: string | null;
  sponsor_type: string | null;
  parent_sponsor_id: string | null;
  parent_sponsor_code: string | null;
  parent_sponsor_name: string | null;
  sponsorship_count: number;
  last_sponsorship_status: string | null;
  last_sponsorship_type: string | null;
  last_sponsorship_amount: string | null;
  last_sponsorship_currency: string | null;
  last_sponsorship_start_date: Date | string | null;
  last_sponsorship_end_date: Date | string | null;
};

export const beneficiarySponsorLinksRepository = {
  async listByBeneficiary(beneficiaryId: string) {
    const rows = await prisma.$queryRaw<BeneficiarySponsorLinkRow[]>`
      select
        bsl.id,
        bsl.beneficiary_id,
        bsl.sponsor_id,
        bsl.sponsor_beneficiary_code,
        bsl.sponsor_file_number,
        bsl.sponsor_reference,
        bsl.registration_date,
        bsl.status,
        bsl.notes,
        bsl.created_at,
        bsl.updated_at,
        s.sponsor_code,
        s.sponsor_name,
        s.sponsor_type,
        s.parent_sponsor_id,
        ps.sponsor_code as parent_sponsor_code,
        ps.sponsor_name as parent_sponsor_name,
        coalesce(sc.sponsorship_count, 0)::int as sponsorship_count,
        last_sp.status as last_sponsorship_status,
        last_sp.sponsorship_type as last_sponsorship_type,
        last_sp.amount::text as last_sponsorship_amount,
        last_sp.currency as last_sponsorship_currency,
        last_sp.start_date as last_sponsorship_start_date,
        last_sp.end_date as last_sponsorship_end_date
      from beneficiary_sponsor_links bsl
      join sponsors s on s.id = bsl.sponsor_id
      left join sponsors ps on ps.id = s.parent_sponsor_id
      left join lateral (
        select count(*)::int as sponsorship_count
        from sponsorships sp
        where sp.beneficiary_sponsor_link_id = bsl.id
      ) sc on true
      left join lateral (
        select
          sp.status,
          sp.sponsorship_type,
          sp.amount,
          sp.currency,
          sp.start_date,
          sp.end_date,
          sp.created_at
        from sponsorships sp
        where sp.beneficiary_sponsor_link_id = bsl.id
        order by sp.created_at desc nulls last, sp.id desc
        limit 1
      ) last_sp on true
      where bsl.beneficiary_id = ${beneficiaryId}::uuid
      order by
        coalesce(ps.sponsor_name, s.sponsor_name),
        s.sponsor_name,
        bsl.created_at desc nulls last
    `;

    return rows;
  },
};

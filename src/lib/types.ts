export type ArticleIdea = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  pdf_path: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  user_id: string;
  event_date: string;
  ticket_reservation_number: string | null;
  ticket_pdf_path: string | null;
  accommodation: string | null;
  address: string | null;
  cost: number | null;
  paid: boolean;
  created_at: string;
};

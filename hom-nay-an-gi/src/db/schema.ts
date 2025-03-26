import { pgTable, text, integer, decimal, jsonb } from 'drizzle-orm/pg-core';

export const selections = pgTable('selections', {
  id: text('id').primaryKey(),
  dishId: integer('dish_id').notNull(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  photoUrl: text('photo_url'),
  quantity: integer('quantity').notNull().default(1),
  timestamp: integer('timestamp').notNull(),
  clientName: text('client_name').notNull(),
  selectedOptions: jsonb('selected_options').notNull(),
  note: text('note') // Added note field
});

-- =============================================================
-- supabase/setup.sql
-- Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- =============================================================

-- ---------- 1. TABLES ----------

-- Class steps 3 & 4: orders
create table if not exists orders (
  id          bigint generated always as identity primary key,
  item        text    not null,
  quantity    integer not null,
  price       numeric not null,
  created_at  timestamptz not null default now()
);

-- Homework: dishes to suggest for each region + weather mood
create table if not exists foods (
  id          bigint generated always as identity primary key,
  region      text not null,   -- state name from lib/places.js, or 'All'
  weather     text not null check (weather in ('hot', 'cold', 'rainy', 'pleasant')),
  name        text not null,
  emoji       text,
  description text
);

-- Homework: every search is saved here (the "write" part)
create table if not exists searches (
  id          bigint generated always as identity primary key,
  region      text not null,
  place       text not null,
  temp        integer,
  condition   text,
  mood        text,
  created_at  timestamptz not null default now()
);

-- ---------- 2. SECURITY (Row Level Security) ----------
-- RLS ON = nobody can touch a table unless a policy allows it.
-- These policies allow ONLY what our API needs.

alter table orders   enable row level security;
alter table foods    enable row level security;
alter table searches enable row level security;

drop policy if exists "read orders"  on orders;
drop policy if exists "add orders"   on orders;
drop policy if exists "read foods"   on foods;
drop policy if exists "add searches" on searches;

create policy "read orders"  on orders   for select to anon using (true);
create policy "add orders"   on orders   for insert to anon with check (true);
create policy "read foods"   on foods    for select to anon using (true);
create policy "add searches" on searches for insert to anon with check (true);

-- ---------- 3. STARTER DATA ----------

-- Sample orders (only added if the table is empty)
insert into orders (item, quantity, price)
select * from (values
  ('T-Shirt', 15, 900),
  ('Track Pant', 10, 1100),
  ('Lower', 3, 720)
) as v(item, quantity, price)
where not exists (select 1 from orders);

-- Foods: start fresh each time this script runs
truncate foods restart identity;

insert into foods (region, weather, name, emoji, description) values
-- Punjab
('Punjab','hot','Meethi Lassi','🥛','Thick, chilled Punjabi lassi topped with malai'),
('Punjab','hot','Shikanji','🍋','Lemon-masala cooler from every street corner'),
('Punjab','cold','Sarson da Saag & Makki di Roti','🥬','The classic Punjabi winter meal with white butter'),
('Punjab','cold','Pinni','🍪','Ghee, atta and dry-fruit laddoo that keeps you warm'),
('Punjab','rainy','Pakode & Adrak Chai','☕','Onion-paneer pakode with strong ginger tea'),
('Punjab','rainy','Aloo Paratha','🫓','Stuffed parathas with butter and achaar'),
('Punjab','pleasant','Amritsari Kulcha & Chole','🍽️','Crispy stuffed kulcha with spicy chole'),
('Punjab','pleasant','Rajma Chawal','🍛','Comfort food for any Punjabi afternoon'),
-- Delhi
('Delhi','hot','Kulfi Falooda','🍨','Kulfi with falooda noodles and rose syrup'),
('Delhi','hot','Aam Panna','🥭','Raw-mango drink that beats the heat'),
('Delhi','cold','Daulat ki Chaat','☁️','Airy winter-only milk foam from Old Delhi'),
('Delhi','cold','Nihari','🍲','Slow-cooked stew, best on a foggy morning'),
('Delhi','rainy','Samosa & Jalebi','🥟','The perfect monsoon pair'),
('Delhi','rainy','Bread Pakora','🍞','Stuffed fried bread with green chutney'),
('Delhi','pleasant','Chole Bhature','🍽️','Fluffy bhature with spicy chole'),
('Delhi','pleasant','Paranthe Wali Gali Paratha','🫓','Deep-fried stuffed parathas from Chandni Chowk'),
-- Uttar Pradesh
('Uttar Pradesh','hot','Thandai','🥛','Cool milk with nuts, fennel and rose'),
('Uttar Pradesh','hot','Banarasi Lassi','🥛','Served in a kulhad with thick malai'),
('Uttar Pradesh','cold','Malaiyyo','☁️','Saffron milk foam, a Banaras winter special'),
('Uttar Pradesh','cold','Bajre ki Khichdi','🍲','Warm millet khichdi with ghee'),
('Uttar Pradesh','rainy','Kachori Sabzi','🥟','Khasta kachori with spicy aloo sabzi'),
('Uttar Pradesh','rainy','Aloo Tikki Chaat','🥔','Crispy tikki with curd and chutneys'),
('Uttar Pradesh','pleasant','Lucknowi Biryani','🍛','Fragrant dum-style Awadhi biryani'),
('Uttar Pradesh','pleasant','Galouti Kebab','🍢','Melt-in-the-mouth Lucknow kebabs'),
-- Rajasthan
('Rajasthan','hot','Chaach','🥛','Spiced buttermilk, the desert''s best friend'),
('Rajasthan','hot','Makhaniya Lassi','🥛','Jodhpur''s rich saffron lassi'),
('Rajasthan','cold','Bajra Roti & Lehsun Chutney','🫓','Millet roti with fiery garlic chutney'),
('Rajasthan','cold','Gond ke Laddoo','🍪','Winter energy laddoo'),
('Rajasthan','rainy','Mirchi Vada','🌶️','Stuffed chilli fritters from Jodhpur'),
('Rajasthan','rainy','Pyaaz Kachori','🥟','Flaky onion kachori'),
('Rajasthan','pleasant','Dal Baati Churma','🍽️','Rajasthan''s most famous meal'),
('Rajasthan','pleasant','Gatte ki Sabzi','🍛','Gram-flour dumplings in curd gravy'),
-- Gujarat
('Gujarat','hot','Chaas','🥛','Light, salty buttermilk with jeera'),
('Gujarat','hot','Aamras Puri','🥭','Fresh mango pulp with hot puris'),
('Gujarat','cold','Undhiyu','🥘','Mixed winter vegetables, an Uttarayan favourite'),
('Gujarat','cold','Adadiya Pak','🍪','Urad dal winter sweet'),
('Gujarat','rainy','Dalwada','🧆','Crispy moong dal fritters'),
('Gujarat','rainy','Methi na Gota','🧆','Fenugreek fritters with chutney'),
('Gujarat','pleasant','Dhokla','🟨','Soft, spongy steamed snack'),
('Gujarat','pleasant','Khandvi','🌀','Thin gram-flour rolls with tadka'),
-- Maharashtra
('Maharashtra','hot','Sol Kadhi','🥤','Kokum and coconut milk cooler'),
('Maharashtra','hot','Aamras Puri','🥭','Alphonso mango pulp with puris'),
('Maharashtra','cold','Misal Pav','🌶️','Spicy sprout curry with pav'),
('Maharashtra','cold','Thalipeeth','🫓','Multi-grain flatbread with butter'),
('Maharashtra','rainy','Vada Pav','🍔','Mumbai''s monsoon must-have with fried chilli'),
('Maharashtra','rainy','Kanda Bhaji','🧅','Crispy onion fritters'),
('Maharashtra','pleasant','Pav Bhaji','🍽️','Buttery bhaji with toasted pav'),
('Maharashtra','pleasant','Puran Poli','🫓','Sweet lentil-stuffed flatbread'),
-- West Bengal
('West Bengal','hot','Aam Pora Shorbot','🥭','Roasted raw-mango drink'),
('West Bengal','hot','Panta Bhat','🍚','Fermented rice, cool and light'),
('West Bengal','cold','Nolen Gur Sandesh','🍬','Sweet made with winter date-palm jaggery'),
('West Bengal','cold','Pitha','🥟','Winter rice cakes'),
('West Bengal','rainy','Khichuri & Beguni','🍲','Monsoon khichuri with brinjal fritters'),
('West Bengal','rainy','Telebhaja','🧆','Assorted fried snacks with muri'),
('West Bengal','pleasant','Kosha Mangsho & Luchi','🍽️','Slow-cooked mutton with puffed luchi'),
('West Bengal','pleasant','Puchka','🥟','Kolkata-style tangy pani puri'),
-- Karnataka
('Karnataka','hot','Majjige','🥛','Spiced buttermilk'),
('Karnataka','hot','Kosambari','🥗','Cool moong dal and cucumber salad'),
('Karnataka','cold','Bisi Bele Bath','🍛','Hot, spicy rice-lentil dish'),
('Karnataka','cold','Ragi Mudde & Saaru','🍲','Finger-millet balls with rasam'),
('Karnataka','rainy','Maddur Vada','🧆','Crispy onion vada'),
('Karnataka','rainy','Goli Baje','🧆','Mangalore-style fluffy fritters'),
('Karnataka','pleasant','Mysore Masala Dosa','🥞','Dosa with red chutney and potato'),
('Karnataka','pleasant','Mysore Pak','🍬','Rich ghee and gram-flour sweet'),
-- Tamil Nadu
('Tamil Nadu','hot','Neer Mor','🥛','Thin spiced buttermilk'),
('Tamil Nadu','hot','Curd Rice','🍚','Cooling curd rice with tempering'),
('Tamil Nadu','cold','Ven Pongal','🍲','Peppery rice-dal with ghee'),
('Tamil Nadu','cold','Chettinad Chicken','🍗','Warming, peppery curry'),
('Tamil Nadu','rainy','Bajji & Filter Coffee','☕','Fritters with strong filter coffee'),
('Tamil Nadu','rainy','Milagu Rasam','🍵','Pepper rasam for a rainy day'),
('Tamil Nadu','pleasant','Idli Sambar','🍽️','Soft idlis with sambar and chutney'),
('Tamil Nadu','pleasant','Masala Dosa','🥞','Crispy dosa with potato masala'),
-- Kerala
('Kerala','hot','Tender Coconut Water','🥥','Straight from the coconut'),
('Kerala','hot','Sambharam','🥛','Kerala-style spiced buttermilk'),
('Kerala','cold','Appam & Stew','🥘','Lacy appam with coconut-milk stew'),
('Kerala','cold','Chukku Kaapi','☕','Dry-ginger coffee that warms you up'),
('Kerala','rainy','Pazham Pori & Chai','🍌','Banana fritters with tea'),
('Kerala','rainy','Kanji & Payar','🍚','Rice gruel with green gram'),
('Kerala','pleasant','Puttu & Kadala Curry','🍽️','Steamed rice cylinders with black chana'),
('Kerala','pleasant','Malabar Parotta','🫓','Flaky layered parotta with curry'),
-- Himachal Pradesh
('Himachal Pradesh','hot','Chha','🥛','Fresh buttermilk'),
('Himachal Pradesh','hot','Babru & Imli Chutney','🫓','Fried bread with tamarind chutney'),
('Himachal Pradesh','cold','Siddu with Ghee','🥟','Steamed stuffed bread, a mountain winter staple'),
('Himachal Pradesh','cold','Thukpa','🍜','Hot noodle soup'),
('Himachal Pradesh','rainy','Steamed Momos','🥟','Momos with spicy red chutney'),
('Himachal Pradesh','rainy','Pakode & Chai','☕','Hill-station rainy-day classic'),
('Himachal Pradesh','pleasant','Chana Madra','🍛','Chickpeas in yoghurt gravy'),
('Himachal Pradesh','pleasant','Kangri Dham','🍽️','Traditional festive Himachali meal'),
-- Jammu and Kashmir
('Jammu and Kashmir','hot','Chilled Phirni','🍮','Ground-rice pudding in clay bowls'),
('Jammu and Kashmir','hot','Kashmiri Lassi','🥛','Light, salted lassi'),
('Jammu and Kashmir','cold','Kahwa','🍵','Saffron-almond green tea'),
('Jammu and Kashmir','cold','Harissa','🍲','Slow-cooked winter breakfast of Srinagar'),
('Jammu and Kashmir','rainy','Nadru Monje & Noon Chai','🍵','Lotus-stem fritters with pink salt tea'),
('Jammu and Kashmir','rainy','Kahwa','🍵','A warm cup for a wet day'),
('Jammu and Kashmir','pleasant','Rajma Chawal','🍛','Famous Jammu rajma with rice'),
('Jammu and Kashmir','pleasant','Kashmiri Dum Aloo','🥔','Baby potatoes in a red yoghurt gravy'),
-- All (fallback for any region)
('All','hot','Watermelon','🍉','Juicy and hydrating'),
('All','hot','Nimbu Paani','🍋','Simple lemon water with salt and sugar'),
('All','cold','Masala Chai','☕','Strong tea with ginger and elaichi'),
('All','cold','Tomato Soup','🍅','Hot soup with bread croutons'),
('All','rainy','Maggi','🍜','Everyone''s rainy-day comfort'),
('All','rainy','Bhutta','🌽','Roasted corn with lemon and masala'),
('All','pleasant','Pani Puri','🥟','Tangy street snack'),
('All','pleasant','Fruit Chaat','🍓','Fresh fruit with chaat masala');

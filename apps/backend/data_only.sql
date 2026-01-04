--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, slug) FROM stdin;
6	Pop	Pop Music	pop
9	Hip-Hop	Hip-Hop & Rap	hiphop
4	Fwaya	Fwaya Music	fwaya
1	Zed	Zambian Music	zed
10	Afrobeat	Afrobeat vibes	afrobeat
11	Gospel	Gospel Music	
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commissions (id, amount, reseller_id, transaction_id, media_id, is_paid, paid_at, created_at, commission_rate, currency, payout_transaction_id, status) FROM stdin;
\.


--
-- Data for Name: currency_exchanges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currency_exchanges (id, from_currency, to_currency, rate, is_active, last_updated) FROM stdin;
\.


--
-- Data for Name: device_licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_licenses (id, user_id, device_id, media_id, transaction_id, license_key, restriction_level, expires_at, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.downloads (id, media_id, user_id, device_id, downloaded_at, expires_at, access_type, is_drm_protected, license_key, extra_data) FROM stdin;
\.


--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.followers (id, follower_id, following_id, created_at) FROM stdin;
1	3	1	2025-08-17 19:51:28.746
2	3	6	2025-08-17 19:52:04.704
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kyc_documents (id, user_id, document_type, document_number, front_image_url, back_image_url, selfie_image_url, status, rejection_reason, reviewed_by, reviewed_at, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: libraries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.libraries (id, user_id, name, description, is_private, created_at, updated_at) FROM stdin;
2	6	Next Library	test	t	2025-08-09 22:34:49.716	2025-08-17 19:58:29.126
3	6	My New Library	test	t	2025-08-17 19:58:13.301	2025-08-17 19:58:29.126
1	1	Hello Library	test	t	2025-08-09 22:33:42.8	2025-08-17 20:00:35.919
\.


--
-- Data for Name: library_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.library_items (id, library_id, media_id, added_at, purchased_at, transaction_id) FROM stdin;
1	1	1	2025-08-09 22:34:15.724	\N	\N
2	2	2	2025-08-09 22:35:11.054	\N	\N
3	3	2	2025-08-17 19:59:11.575	\N	\N
4	2	4	2025-08-17 19:59:27.091	\N	\N
5	2	5	2025-08-17 19:59:40.48	\N	\N
6	1	2	2025-08-17 20:00:10.955	\N	\N
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, url, art_cover_url, thumbnail_url, format, duration, title, description, genre, tags, type, access_type, price, is_explicit, play_count, download_count, share_count, last_played_at, created_at, updated_at, user_id, cloudinary_public_id, bpm, key, energy, danceability, valence, acousticness, allow_reselling, artist_commission_rate, encryption_key, is_drm_protected, max_devices, platform_commission_rate, reseller_commission_rate) FROM stdin;
2	https://res.cloudinary.com/dayn5vifn/video/upload/v1744675902/w6xdp90biwe6ppa3fz4m.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	210	Ancient Word	test	Gospel	{pop}	AUDIO	PREMIUM	5	t	0	0	0	\N	2025-08-09 22:32:00.232	2025-08-24 15:47:12.021	3	w6xdp90biwe6ppa3fz4m	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
1	https://res.cloudinary.com/dayn5vifn/video/upload/v1744677886/mhtbhebpvuftr7stjl4l.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	340	Draw Me Close	test	beat	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-09 22:23:33.957	2025-10-16 17:26:07.512	8	mhtbhebpvuftr7stjl4l	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
3	https://res.cloudinary.com/dayn5vifn/video/upload/v1744550558/lmftsyn4iks8bysd9o7p.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	230	Lift Up Your Eyes ft Fwaya	test	Pop	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-09 23:14:10.853	2025-08-24 19:51:54.954	4	lmftsyn4iks8bysd9o7p	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
7	https://res.cloudinary.com/dayn5vifn/video/upload/v1756050717/KirkF-_Imagi_01_kt41af.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	150	Imagine Me	Latest	Gospel	{gospel}	AUDIO	PREMIUM	10	f	0	0	0	\N	2025-08-24 15:52:34.67	2025-10-16 17:29:41.367	2	KirkF-_Imagi_01_kt41af	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
8	https://res.cloudinary.com/dayn5vifn/video/upload/v1744471001/htezcgfwlrlhzqgf0cjq.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	Love You Forever	The Jam	Gospel	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-24 19:46:09.312	2025-08-24 19:40:53.021	4	htezcgfwlrlhzqgf0cjq	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
12	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132184/20_Don_Williams_-_Love_Me_Over_Again_s1xpcs.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	Someone Like You	From Adel	Gospel	{gospel}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:05:15.615	2025-09-17 17:41:46.045	5	Adele_-_Someone_Like_You_peljvv	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
15	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132152/04_For_A_Moment_mr12pt.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	190	For A Moment	From Brook Hogan	pop	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:12:03.431	2025-09-17 18:10:18.602	6	04_For_A_Moment_mr12pt	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
17	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132199/13_Mariah_Carey_-_Bye_Bye_nrhl0p.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	190	Bye Bye	From Carey	\N	{}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:16:25.351	2025-09-17 18:14:52.912	4	13_Mariah_Carey_-_Bye_Bye_nrhl0p	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
14	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132153/14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	210	I'm Just A Country Boy	From Don Williams	country	{country}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:10:11.664	2025-09-17 18:20:46.672	7	14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
5	https://res.cloudinary.com/dayn5vifn/video/upload/v1755458015/005_-_Mario_-_How_Do_I_Breathe_jbt2di.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	How Do I Breath	test	beat	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-17 19:24:43.03	2025-10-16 17:26:17.864	6	005_-_Mario_-_How_Do_I_Breathe_jbt2di	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
4	https://res.cloudinary.com/dayn5vifn/video/upload/v1743857702/samples/sea-turtle.mp4	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp4	113	Vibes Video	test	Pop	{pop}	VIDEO	PREMIUM	5	f	0	0	0	\N	2025-08-09 23:17:10.487	2025-10-16 17:31:35.123	3	samples/sea-turtle	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
13	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132142/08_Don_Williams_-_You_re_My_Best_Friend_fxivdm.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	250	You're My Bestfriend	From Don Williams	slow	{slow}	AUDIO	PAY_PER_VIEW	2	f	0	0	0	\N	2025-09-17 18:07:50.959	2025-10-16 17:29:41.367	2	08_Don_Williams_-_You_re_My_Best_Friend_fxivdm	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
16	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132177/04.Ne-Yo-Mad_iM1_-_Copy_gwcqml.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	100	Mad	From Ne-yo	pop	{pop}	AUDIO	PREMIUM	40	f	0	0	0	\N	2025-09-17 18:14:31.754	2025-10-16 17:29:41.367	5	04.Ne-Yo-Mad_iM1_-_Copy_gwcqml	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
18	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132163/19_Don_Williams_-_It_Must_Be_Love_jwjwdb.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	160	It's Must Be Love	From Don Williams	country	{country}	AUDIO	PREMIUM	20	f	0	0	0	\N	2025-09-17 18:19:31.372	2025-10-16 17:29:41.367	3	19_Don_Williams_-_It_Must_Be_Love_jwjwdb	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
\.


--
-- Data for Name: media_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_categories (media_id, category_id, assigned_at) FROM stdin;
1	1	2025-08-09 22:38:11.715
2	1	2025-08-17 19:40:31.036
5	6	2025-08-17 19:40:55.292
5	10	2025-08-17 19:41:55.275
5	9	2025-08-17 19:42:26.386
1	11	2025-08-17 19:42:52.089
\.


--
-- Data for Name: media_interactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_interactions (id, media_id, user_id, liked, saved, played, "position", interacted_at) FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, title, slug, summary, content, "imageUrl", "authorId", "publishedAt", "updatedAt", "isPublished", tags, metadata) FROM stdin;
1	Fwaya Platform Launch	Na Mumfwa ka	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	1	2025-10-16 16:51:48.597	2025-10-16 16:54:42.742	t	{}	null
2	Fwaya Music	Music by Fwaya	Fwaya..........	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	1	2025-10-16 17:19:02.531	2025-10-16 17:17:54.416	t	{}	null
6	These are test news items	Wait and see	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	2	2025-10-16 17:22:02.293	2025-10-16 17:20:58.345	t	{}	null
7	Now We are close	Its a good feeling	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	3	2025-10-16 17:22:59.944	2025-10-16 17:22:06.305	t	{}	null
\.


--
-- Data for Name: news_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_bookmarks (id, "newsId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: news_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_comments (id, "newsId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: news_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_likes (id, "newsId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: news_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_reactions (id, "newsId", "userId", type, "reactedAt") FROM stdin;
\.


--
-- Data for Name: news_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_reports (id, "newsId", "userId", reason, details, "reportedAt") FROM stdin;
\.


--
-- Data for Name: news_shares; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_shares (id, "newsId", "userId", "sharedAt") FROM stdin;
\.


--
-- Data for Name: news_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_views (id, "newsId", "userId", "viewedAt", "ipAddress") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, is_read, type, metadata, created_at) FROM stdin;
1	1	Admin	Welcome!	t	system	null	2025-08-17 19:56:19.644
\.


--
-- Data for Name: now_playing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.now_playing (id, user_id, media_id, "position", is_playing, device_id, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_accounts (id, user_id, provider, account_type, account_number, account_name, country, currency, is_verified, is_default, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payout_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_requests (id, user_id, amount, currency, status, payment_account_id, reason, metadata, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payout_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_transactions (id, payment_account_id, transaction_id, amount, currency, status, reference, provider_reference, fees, metadata, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playlist_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playlist_entries (id, playlist_id, media_id, "position", added_at, added_by) FROM stdin;
2	2	5	1	2025-08-17 19:46:52.54	\N
1	2	3	2	2025-08-17 19:46:05.234	\N
3	2	4	3	2025-08-17 19:47:13.37	\N
4	2	1	4	2025-08-17 19:47:40.17	\N
5	1	4	1	2025-08-17 19:47:58.242	\N
6	1	1	2	2025-08-17 19:48:17.673	\N
7	1	3	4	2025-08-17 19:48:36.976	\N
\.


--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playlists (id, name, description, cover_url, is_public, type, rules, created_at, updated_at, user_id) FROM stdin;
1	Fwaya Playlist	Music for the soul	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg	t	SYSTEM	null	2025-08-09 22:37:24.327	2025-08-24 12:58:22.96	7
2	Yes My Playlist	Neat	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg	t	SYSTEM	null	2025-08-17 19:45:20.138	2025-10-16 16:43:57.85	7
\.


--
-- Data for Name: reseller_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_links (id, code, reseller_id, media_id, click_count, created_at, conversion_count, custom_commission_rate, expires_at, status) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at) FROM stdin;
1	1	muwanatoken	\N	\N	1970-01-01 00:00:00	2025-08-17 20:04:35.07
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, amount, status, user_id, media_id, reference, metadata, created_at, updated_at, currency, exchange_rate, is_reseller_sale, original_amount, original_currency, payment_method, payment_provider, provider_reference, reseller_link_id) FROM stdin;
1	5	PENDING	1	2	TRX-1760034149274-v1kgdewo8	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:22:29.276	2025-10-09 18:22:29.276	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
2	5	PENDING	1	2	TRX-1760034181241-8up4hzsjd	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:23:01.243	2025-10-09 18:23:01.243	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
3	5	PENDING	1	2	TRX-1760034264227-jmr8yw3e6	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:24:24.23	2025-10-09 18:24:24.23	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
4	5	PENDING	1	2	TRX-1760034291326-lsvuxanie	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:24:51.328	2025-10-09 18:24:51.328	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
5	5	PENDING	1	2	TRX-1760034455438-pwyi9i0o5	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:27:35.44	2025-10-09 18:27:35.44	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
6	5	PENDING	1	2	TRX-1760543150578-e08tbgois	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 15:45:50.586	2025-10-15 15:45:50.586	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
7	5	PENDING	1	2	TRX-1760543243060-cg5yvycen	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 15:47:23.062	2025-10-15 15:47:23.062	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
8	5	PENDING	1	2	TRX-1760544262696-0olkws5g8	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 16:04:22.7	2025-10-15 16:04:22.7	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
9	5	PENDING	1	2	TRX-1760544298409-5ici93jfw	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 16:04:58.413	2025-10-15 16:04:58.413	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
10	5	PENDING	1	2	TRX-1760557332912-sfjzqqg2p	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 19:42:12.917	2025-10-15 19:42:12.917	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_devices (id, user_id, device_id, device_name, last_active_at, device_type, fingerprint, os) FROM stdin;
1	5	1	device-xyz	\N	\N	\N	\N
2	1	2	device-xyz	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, display_name, avatar_url, is_social_auth, provider, social_id, last_login_at, role, is_premium, premium_until, wallet_balance, total_earnings, created_at, updated_at, commission_rate, country, "defaultCurrency", is_reseller, paid_commission, reseller_code, total_commission, accepted_privacy, accepted_terms, address, artist_name, bio, business_name, business_type, consent_date, data_sharing, date_of_birth, is_email_verified, is_phone_verified, marketing_emails, phone_number, social_links, stage_name, status, tax_id, tax_number, website) FROM stdin;
4	bmkmuwana	FwayaPremium	Bismark@2	FwayaP	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	0	0	2025-08-09 23:06:04.295	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
5	bismax100@gmail.com	Bizzo	Kwibisa@2	BizzoPPV	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	0	0	2025-08-09 23:09:47.823	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
6	angelkwibisa203@gmail.com	DonChainz	Angel2	DonChainz	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-17 19:33:09.137	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
7	angelkwibisa897@gmail.com	Don	AngelKwib11	Don	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	50	0	2025-08-17 19:35:47.546	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
8	kwibisa.bymax@gmail.com	Betty	Betty22278D	BettyArt	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-17 19:38:18.71	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
1	kwibisa12@gmail.com	BymaxUser	kwibisa2	BymaxUser	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	USER	f	\N	0	0	2025-06-10 16:54:56.848	2025-10-16 16:36:12.773	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	VERIFIED	\N	\N	\N
3	bymaxzm@gmail.com	BigBizzo	Kwibisa@2	BizzoArtist	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-09 17:38:37.158	2025-10-16 16:36:39.26	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	ACTIVE	\N	\N	\N
2	kwibisa21@gmail.com	Admin	kwibisa2	Bymax	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ADMIN	f	\N	0	0	2025-06-10 16:56:44.318	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verifications (id, user_id, method, code, token, is_verified, expires_at, verified_at, metadata, created_at) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commissions_id_seq', 1, false);


--
-- Name: currency_exchanges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.currency_exchanges_id_seq', 1, false);


--
-- Name: device_licenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_licenses_id_seq', 1, false);


--
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.downloads_id_seq', 1, false);


--
-- Name: followers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.followers_id_seq', 2, true);


--
-- Name: kyc_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kyc_documents_id_seq', 1, false);


--
-- Name: libraries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.libraries_id_seq', 3, true);


--
-- Name: library_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.library_items_id_seq', 6, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_id_seq', 18, true);


--
-- Name: media_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_interactions_id_seq', 1, false);


--
-- Name: news_bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_bookmarks_id_seq', 1, false);


--
-- Name: news_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_comments_id_seq', 1, false);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_id_seq', 7, true);


--
-- Name: news_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_likes_id_seq', 1, false);


--
-- Name: news_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_reactions_id_seq', 1, false);


--
-- Name: news_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_reports_id_seq', 1, false);


--
-- Name: news_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_shares_id_seq', 1, false);


--
-- Name: news_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_views_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: now_playing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.now_playing_id_seq', 1, false);


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_accounts_id_seq', 1, false);


--
-- Name: payout_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payout_requests_id_seq', 1, false);


--
-- Name: payout_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payout_transactions_id_seq', 1, false);


--
-- Name: playlist_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playlist_entries_id_seq', 7, true);


--
-- Name: playlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playlists_id_seq', 2, true);


--
-- Name: reseller_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reseller_links_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 10, true);


--
-- Name: user_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_devices_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verifications_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--


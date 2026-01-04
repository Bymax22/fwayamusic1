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



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (6, 'Pop', 'Pop Music', 'pop');
INSERT INTO public.categories VALUES (9, 'Hip-Hop', 'Hip-Hop & Rap', 'hiphop');
INSERT INTO public.categories VALUES (4, 'Fwaya', 'Fwaya Music', 'fwaya');
INSERT INTO public.categories VALUES (1, 'Zed', 'Zambian Music', 'zed');
INSERT INTO public.categories VALUES (10, 'Afrobeat', 'Afrobeat vibes', 'afrobeat');
INSERT INTO public.categories VALUES (11, 'Gospel', 'Gospel Music', '');


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: currency_exchanges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: device_licenses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.followers VALUES (1, 3, 1, '2025-08-17 19:51:28.746');
INSERT INTO public.followers VALUES (2, 3, 6, '2025-08-17 19:52:04.704');


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: libraries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.libraries VALUES (2, 6, 'Next Library', 'test', true, '2025-08-09 22:34:49.716', '2025-08-17 19:58:29.126');
INSERT INTO public.libraries VALUES (3, 6, 'My New Library', 'test', true, '2025-08-17 19:58:13.301', '2025-08-17 19:58:29.126');
INSERT INTO public.libraries VALUES (1, 1, 'Hello Library', 'test', true, '2025-08-09 22:33:42.8', '2025-08-17 20:00:35.919');


--
-- Data for Name: library_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.library_items VALUES (1, 1, 1, '2025-08-09 22:34:15.724', NULL, NULL);
INSERT INTO public.library_items VALUES (2, 2, 2, '2025-08-09 22:35:11.054', NULL, NULL);
INSERT INTO public.library_items VALUES (3, 3, 2, '2025-08-17 19:59:11.575', NULL, NULL);
INSERT INTO public.library_items VALUES (4, 2, 4, '2025-08-17 19:59:27.091', NULL, NULL);
INSERT INTO public.library_items VALUES (5, 2, 5, '2025-08-17 19:59:40.48', NULL, NULL);
INSERT INTO public.library_items VALUES (6, 1, 2, '2025-08-17 20:00:10.955', NULL, NULL);


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.media VALUES (2, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1744675902/w6xdp90biwe6ppa3fz4m.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 210, 'Ancient Word', 'test', 'Gospel', '{pop}', 'AUDIO', 'PREMIUM', 5, true, 0, 0, 0, NULL, '2025-08-09 22:32:00.232', '2025-08-24 15:47:12.021', 3, 'w6xdp90biwe6ppa3fz4m', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (1, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1744677886/mhtbhebpvuftr7stjl4l.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 340, 'Draw Me Close', 'test', 'beat', '{pop}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-08-09 22:23:33.957', '2025-10-16 17:26:07.512', 8, 'mhtbhebpvuftr7stjl4l', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (3, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1744550558/lmftsyn4iks8bysd9o7p.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 230, 'Lift Up Your Eyes ft Fwaya', 'test', 'Pop', '{pop}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-08-09 23:14:10.853', '2025-08-24 19:51:54.954', 4, 'lmftsyn4iks8bysd9o7p', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (7, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1756050717/KirkF-_Imagi_01_kt41af.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 150, 'Imagine Me', 'Latest', 'Gospel', '{gospel}', 'AUDIO', 'PREMIUM', 10, false, 0, 0, 0, NULL, '2025-08-24 15:52:34.67', '2025-10-16 17:29:41.367', 2, 'KirkF-_Imagi_01_kt41af', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (8, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1744471001/htezcgfwlrlhzqgf0cjq.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 200, 'Love You Forever', 'The Jam', 'Gospel', '{pop}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-08-24 19:46:09.312', '2025-08-24 19:40:53.021', 4, 'htezcgfwlrlhzqgf0cjq', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (12, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132184/20_Don_Williams_-_Love_Me_Over_Again_s1xpcs.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 200, 'Someone Like You', 'From Adel', 'Gospel', '{gospel}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-09-17 18:05:15.615', '2025-09-17 17:41:46.045', 5, 'Adele_-_Someone_Like_You_peljvv', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (15, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132152/04_For_A_Moment_mr12pt.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 190, 'For A Moment', 'From Brook Hogan', 'pop', '{pop}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-09-17 18:12:03.431', '2025-09-17 18:10:18.602', 6, '04_For_A_Moment_mr12pt', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (17, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132199/13_Mariah_Carey_-_Bye_Bye_nrhl0p.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 190, 'Bye Bye', 'From Carey', NULL, '{}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-09-17 18:16:25.351', '2025-09-17 18:14:52.912', 4, '13_Mariah_Carey_-_Bye_Bye_nrhl0p', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (14, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132153/14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 210, 'I''m Just A Country Boy', 'From Don Williams', 'country', '{country}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-09-17 18:10:11.664', '2025-09-17 18:20:46.672', 7, '14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (5, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1755458015/005_-_Mario_-_How_Do_I_Breathe_jbt2di.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 200, 'How Do I Breath', 'test', 'beat', '{pop}', 'AUDIO', 'FREE', 0, false, 0, 0, 0, NULL, '2025-08-17 19:24:43.03', '2025-10-16 17:26:17.864', 6, '005_-_Mario_-_How_Do_I_Breathe_jbt2di', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (4, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1743857702/samples/sea-turtle.mp4', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp4', 113, 'Vibes Video', 'test', 'Pop', '{pop}', 'VIDEO', 'PREMIUM', 5, false, 0, 0, 0, NULL, '2025-08-09 23:17:10.487', '2025-10-16 17:31:35.123', 3, 'samples/sea-turtle', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (13, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132142/08_Don_Williams_-_You_re_My_Best_Friend_fxivdm.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 250, 'You''re My Bestfriend', 'From Don Williams', 'slow', '{slow}', 'AUDIO', 'PAY_PER_VIEW', 2, false, 0, 0, 0, NULL, '2025-09-17 18:07:50.959', '2025-10-16 17:29:41.367', 2, '08_Don_Williams_-_You_re_My_Best_Friend_fxivdm', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (16, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132177/04.Ne-Yo-Mad_iM1_-_Copy_gwcqml.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 100, 'Mad', 'From Ne-yo', 'pop', '{pop}', 'AUDIO', 'PREMIUM', 40, false, 0, 0, 0, NULL, '2025-09-17 18:14:31.754', '2025-10-16 17:29:41.367', 5, '04.Ne-Yo-Mad_iM1_-_Copy_gwcqml', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);
INSERT INTO public.media VALUES (18, 'https://res.cloudinary.com/dayn5vifn/video/upload/v1758132163/19_Don_Williams_-_It_Must_Be_Love_jwjwdb.mp3', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg', 'mp3', 160, 'It''s Must Be Love', 'From Don Williams', 'country', '{country}', 'AUDIO', 'PREMIUM', 20, false, 0, 0, 0, NULL, '2025-09-17 18:19:31.372', '2025-10-16 17:29:41.367', 3, '19_Don_Williams_-_It_Must_Be_Love_jwjwdb', NULL, NULL, NULL, NULL, NULL, NULL, true, 0.5, NULL, false, 1, 0.3, NULL);


--
-- Data for Name: media_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.media_categories VALUES (1, 1, '2025-08-09 22:38:11.715');
INSERT INTO public.media_categories VALUES (2, 1, '2025-08-17 19:40:31.036');
INSERT INTO public.media_categories VALUES (5, 6, '2025-08-17 19:40:55.292');
INSERT INTO public.media_categories VALUES (5, 10, '2025-08-17 19:41:55.275');
INSERT INTO public.media_categories VALUES (5, 9, '2025-08-17 19:42:26.386');
INSERT INTO public.media_categories VALUES (1, 11, '2025-08-17 19:42:52.089');


--
-- Data for Name: media_interactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.news VALUES (1, 'Fwaya Platform Launch', 'Na Mumfwa ka', 'Fwaya Innovations online music streaming platform expected to launch...', 'Content coming soon as you see it kkkkkkkk', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 1, '2025-10-16 16:51:48.597', '2025-10-16 16:54:42.742', true, '{}', 'null');
INSERT INTO public.news VALUES (2, 'Fwaya Music', 'Music by Fwaya', 'Fwaya..........', 'Content coming soon as you see it kkkkkkkk', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 1, '2025-10-16 17:19:02.531', '2025-10-16 17:17:54.416', true, '{}', 'null');
INSERT INTO public.news VALUES (6, 'These are test news items', 'Wait and see', 'Fwaya Innovations online music streaming platform expected to launch...', 'Content coming soon as you see it kkkkkkkk', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 2, '2025-10-16 17:22:02.293', '2025-10-16 17:20:58.345', true, '{}', 'null');
INSERT INTO public.news VALUES (7, 'Now We are close', 'Its a good feeling', 'Fwaya Innovations online music streaming platform expected to launch...', 'Content coming soon as you see it kkkkkkkk', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg', 3, '2025-10-16 17:22:59.944', '2025-10-16 17:22:06.305', true, '{}', 'null');


--
-- Data for Name: news_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_comments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_likes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_reactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_reports; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_shares; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: news_views; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES (1, 1, 'Admin', 'Welcome!', true, 'system', 'null', '2025-08-17 19:56:19.644');


--
-- Data for Name: now_playing; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment_accounts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payout_requests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payout_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: playlist_entries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.playlist_entries VALUES (2, 2, 5, 1, '2025-08-17 19:46:52.54', NULL);
INSERT INTO public.playlist_entries VALUES (1, 2, 3, 2, '2025-08-17 19:46:05.234', NULL);
INSERT INTO public.playlist_entries VALUES (3, 2, 4, 3, '2025-08-17 19:47:13.37', NULL);
INSERT INTO public.playlist_entries VALUES (4, 2, 1, 4, '2025-08-17 19:47:40.17', NULL);
INSERT INTO public.playlist_entries VALUES (5, 1, 4, 1, '2025-08-17 19:47:58.242', NULL);
INSERT INTO public.playlist_entries VALUES (6, 1, 1, 2, '2025-08-17 19:48:17.673', NULL);
INSERT INTO public.playlist_entries VALUES (7, 1, 3, 4, '2025-08-17 19:48:36.976', NULL);


--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.playlists VALUES (1, 'Fwaya Playlist', 'Music for the soul', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg', true, 'SYSTEM', 'null', '2025-08-09 22:37:24.327', '2025-08-24 12:58:22.96', 7);
INSERT INTO public.playlists VALUES (2, 'Yes My Playlist', 'Neat', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg', true, 'SYSTEM', 'null', '2025-08-17 19:45:20.138', '2025-10-16 16:43:57.85', 7);


--
-- Data for Name: reseller_links; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions VALUES (1, 1, 'muwanatoken', NULL, NULL, '1970-01-01 00:00:00', '2025-08-17 20:04:35.07');


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions VALUES (1, 5, 'PENDING', 1, 2, 'TRX-1760034149274-v1kgdewo8', '{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-09 18:22:29.276', '2025-10-09 18:22:29.276', 'ZMW', NULL, false, NULL, NULL, 'CREDIT_CARD', 'STRIPE', NULL, NULL);
INSERT INTO public.transactions VALUES (2, 5, 'PENDING', 1, 2, 'TRX-1760034181241-8up4hzsjd', '{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-09 18:23:01.243', '2025-10-09 18:23:01.243', 'ZMW', NULL, false, NULL, NULL, 'CREDIT_CARD', 'STRIPE', NULL, NULL);
INSERT INTO public.transactions VALUES (3, 5, 'PENDING', 1, 2, 'TRX-1760034264227-jmr8yw3e6', '{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-09 18:24:24.23', '2025-10-09 18:24:24.23', 'ZMW', NULL, false, NULL, NULL, 'CREDIT_CARD', 'STRIPE', NULL, NULL);
INSERT INTO public.transactions VALUES (4, 5, 'PENDING', 1, 2, 'TRX-1760034291326-lsvuxanie', '{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-09 18:24:51.328', '2025-10-09 18:24:51.328', 'ZMW', NULL, false, NULL, NULL, 'CREDIT_CARD', 'STRIPE', NULL, NULL);
INSERT INTO public.transactions VALUES (5, 5, 'PENDING', 1, 2, 'TRX-1760034455438-pwyi9i0o5', '{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-09 18:27:35.44', '2025-10-09 18:27:35.44', 'ZMW', NULL, false, NULL, NULL, 'CREDIT_CARD', 'STRIPE', NULL, NULL);
INSERT INTO public.transactions VALUES (6, 5, 'PENDING', 1, 2, 'TRX-1760543150578-e08tbgois', '{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-15 15:45:50.586', '2025-10-15 15:45:50.586', 'ZMW', NULL, false, NULL, NULL, 'MOBILE_MONEY', 'MTN_MONEY', NULL, NULL);
INSERT INTO public.transactions VALUES (7, 5, 'PENDING', 1, 2, 'TRX-1760543243060-cg5yvycen', '{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-15 15:47:23.062', '2025-10-15 15:47:23.062', 'ZMW', NULL, false, NULL, NULL, 'MOBILE_MONEY', 'MTN_MONEY', NULL, NULL);
INSERT INTO public.transactions VALUES (8, 5, 'PENDING', 1, 2, 'TRX-1760544262696-0olkws5g8', '{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-15 16:04:22.7', '2025-10-15 16:04:22.7', 'ZMW', NULL, false, NULL, NULL, 'MOBILE_MONEY', 'MTN_MONEY', NULL, NULL);
INSERT INTO public.transactions VALUES (9, 5, 'PENDING', 1, 2, 'TRX-1760544298409-5ici93jfw', '{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-15 16:04:58.413', '2025-10-15 16:04:58.413', 'ZMW', NULL, false, NULL, NULL, 'MOBILE_MONEY', 'MTN_MONEY', NULL, NULL);
INSERT INTO public.transactions VALUES (10, 5, 'PENDING', 1, 2, 'TRX-1760557332912-sfjzqqg2p', '{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}', '2025-10-15 19:42:12.917', '2025-10-15 19:42:12.917', 'ZMW', NULL, false, NULL, NULL, 'MOBILE_MONEY', 'MTN_MONEY', NULL, NULL);


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_devices VALUES (1, 5, '1', 'device-xyz', NULL, NULL, NULL, NULL);
INSERT INTO public.user_devices VALUES (2, 1, '2', 'device-xyz', NULL, NULL, NULL, NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (4, 'bmkmuwana', 'FwayaPremium', 'Bismark@2', 'FwayaP', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', false, NULL, NULL, NULL, 'ARTIST', true, NULL, 0, 0, '2025-08-09 23:06:04.295', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);
INSERT INTO public.users VALUES (5, 'bismax100@gmail.com', 'Bizzo', 'Kwibisa@2', 'BizzoPPV', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', false, NULL, NULL, NULL, 'ARTIST', true, NULL, 0, 0, '2025-08-09 23:09:47.823', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);
INSERT INTO public.users VALUES (6, 'angelkwibisa203@gmail.com', 'DonChainz', 'Angel2', 'DonChainz', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', true, NULL, NULL, NULL, 'ARTIST', false, NULL, 0, 0, '2025-08-17 19:33:09.137', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);
INSERT INTO public.users VALUES (7, 'angelkwibisa897@gmail.com', 'Don', 'AngelKwib11', 'Don', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', false, NULL, NULL, NULL, 'ARTIST', true, NULL, 50, 0, '2025-08-17 19:35:47.546', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);
INSERT INTO public.users VALUES (8, 'kwibisa.bymax@gmail.com', 'Betty', 'Betty22278D', 'BettyArt', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', true, NULL, NULL, NULL, 'ARTIST', false, NULL, 0, 0, '2025-08-17 19:38:18.71', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);
INSERT INTO public.users VALUES (1, 'kwibisa12@gmail.com', 'BymaxUser', 'kwibisa2', 'BymaxUser', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', false, NULL, NULL, NULL, 'USER', false, NULL, 0, 0, '2025-06-10 16:54:56.848', '2025-10-16 16:36:12.773', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'VERIFIED', NULL, NULL, NULL);
INSERT INTO public.users VALUES (3, 'bymaxzm@gmail.com', 'BigBizzo', 'Kwibisa@2', 'BizzoArtist', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', true, NULL, NULL, NULL, 'ARTIST', false, NULL, 0, 0, '2025-08-09 17:38:37.158', '2025-10-16 16:36:39.26', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'ACTIVE', NULL, NULL, NULL);
INSERT INTO public.users VALUES (2, 'kwibisa21@gmail.com', 'Admin', 'kwibisa2', 'Bymax', 'https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg', false, NULL, NULL, NULL, 'ADMIN', false, NULL, 0, 0, '2025-06-10 16:56:44.318', '2025-10-16 16:34:13.454', 0.2, 'Lusaka, Zambia', 'ZMW', false, 0, NULL, 0, false, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, false, false, false, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL);


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: -
--



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


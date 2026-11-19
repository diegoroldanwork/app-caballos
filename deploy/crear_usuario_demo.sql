-- =====================================================================
-- Querencia · Usuario de la escuela de demo
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- Crea demo@losaromos.com.ar con la contraseña de abajo y lo hace admin
-- de la Escuela Ecuestre Los Aromos.
-- =====================================================================
do $$
declare
  v_email text := 'demo@losaromos.com.ar';
  v_pass  text := 'Tropilla-demo-2026';   -- la misma que va en Vercel (NEXT_PUBLIC_DEMO_PASSWORD)
  v_id    uuid;
begin
  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
            extensions.crypt(v_pass, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', '{"nombre":"Demo Los Aromos"}', now(), now(),
            '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());
  else
    update auth.users set encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')) where id = v_id;
  end if;

  insert into public.miembros_escuela (escuela_id, user_id, rol)
  values ('a0000000-0000-4000-8000-000000000001', v_id, 'admin')
  on conflict do nothing;
end $$;

-- Chequeo: tiene que devolver 1 fila con rol admin
select u.email, m.rol, e.nombre
from auth.users u
join public.miembros_escuela m on m.user_id = u.id
join public.escuelas e on e.id = m.escuela_id
where u.email = 'demo@losaromos.com.ar';

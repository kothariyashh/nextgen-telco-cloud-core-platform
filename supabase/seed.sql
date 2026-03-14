-- NGCMCP demo seed data

INSERT INTO public.tenants (id, name, slug, plan)
VALUES ('11111111-0000-0000-0000-000000000001', 'Demo Operator', 'demo-operator', 'growth')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.regions (id, name, code, cloud_provider, country)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'Mumbai', 'AP-SOUTH-1', 'aws', 'India'),
  ('22222222-0000-0000-0000-000000000002', 'Frankfurt', 'EU-CENTRAL-1', 'azure', 'Germany'),
  ('22222222-0000-0000-0000-000000000003', 'Singapore', 'AP-SE-1', 'gcp', 'Singapore')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vendors (id, name, website_url, support_email, is_verified)
VALUES
  ('33333333-0000-0000-0000-000000000001', 'EdgeWave Systems', 'https://edgewave.example.com', 'support@edgewave.example.com', TRUE),
  ('33333333-0000-0000-0000-000000000002', 'SignalPath Labs', 'https://signalpath.example.com', 'support@signalpath.example.com', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.network_functions (id, tenant_id, name, nf_type, generation, status, region_id, resource_limits)
VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'AMF-Mumbai-01', 'AMF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":2,"cpu":"1","memory":"2Gi"}'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'SMF-Mumbai-01', 'SMF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":2,"cpu":"1","memory":"2Gi"}'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'UPF-Mumbai-01', 'UPF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":3,"cpu":"2","memory":"4Gi"}'),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'PCF-Mumbai-01', 'PCF', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":1,"cpu":"500m","memory":"1Gi"}'),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'UDM-Mumbai-01', 'UDM', '5G', 'active', '22222222-0000-0000-0000-000000000001', '{"replicas":1,"cpu":"500m","memory":"1Gi"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.nf_instances (tenant_id, network_function_id, instance_name, pod_name, node_name, status, cpu_usage, memory_usage, started_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'amf-0', 'amf-0', 'node-a', 'running', 41.2, 57.8, NOW() - INTERVAL '3 days'),
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'smf-0', 'smf-0', 'node-b', 'running', 36.4, 49.1, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.network_slices (id, tenant_id, name, slice_type, status, bandwidth_mbps, latency_target_ms, max_subscribers)
VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Enterprise-IoT-Mumbai', 'IoT', 'active', 100, 50, 20000),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Broadband-eMBB-Mumbai', 'eMBB', 'active', 1000, 20, 100000),
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Industrial-URLLC-Mumbai', 'URLLC', 'active', 500, 1, 15000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscribers (id, tenant_id, imsi, msisdn, status, plan, data_limit_gb, roaming_enabled)
VALUES
  ('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '404451234567890', '919876540001', 'active', 'enterprise', 250, TRUE),
  ('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '404451234567891', '919876540002', 'active', 'growth', 120, FALSE),
  ('66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '404451234567892', '919876540003', 'suspended', 'starter', 60, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sim_cards (tenant_id, subscriber_id, iccid, imsi, sim_type, status, activated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '8991101200003204511', '404451234567890', 'eSIM', 'active', NOW() - INTERVAL '60 days'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '8991101200003204512', '404451234567891', 'physical', 'active', NOW() - INTERVAL '42 days')
ON CONFLICT (iccid) DO NOTHING;

INSERT INTO public.subscriber_devices (tenant_id, subscriber_id, imei, device_model, os, last_seen_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '352099001761481', 'Industrial Gateway X', 'Linux', NOW() - INTERVAL '5 minutes'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '352099001761482', 'Smart Router CPE', 'Android', NOW() - INTERVAL '11 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.slice_assignments (tenant_id, slice_id, subscriber_id, assigned_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),
  ('11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000002', NOW() - INTERVAL '40 days')
ON CONFLICT (slice_id, subscriber_id) DO NOTHING;

INSERT INTO public.sessions (id, tenant_id, subscriber_id, slice_id, session_type, status, upf_id, ip_address, start_time, bytes_uplink, bytes_downlink, qos_class)
VALUES
  ('77777777-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'PDU', 'active', '44444444-0000-0000-0000-000000000003', '10.90.2.10', NOW() - INTERVAL '2 hours', 8589934592, 17179869184, 'QCI-7'),
  ('77777777-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'PDU', 'idle', '44444444-0000-0000-0000-000000000003', '10.90.2.11', NOW() - INTERVAL '5 hours', 2147483648, 4294967296, 'QCI-9')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.session_events (tenant_id, session_id, event_type, event_data, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'created', '{"source":"smf"}', NOW() - INTERVAL '2 hours'),
  ('11111111-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'qos_change', '{"from":"QCI-9","to":"QCI-7"}', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_rules (tenant_id, name, rule_type, conditions, actions, priority, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'IoT-Low-Latency', 'QoS', '{"slice_type":"IoT"}', '{"qci":"QCI-7","max_jitter_ms":20}', 50, TRUE),
  ('11111111-0000-0000-0000-000000000001', 'Roaming-Guardrail', 'access_control', '{"roaming":true}', '{"allow_countries":["IN","SG","DE"]}', 60, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.qos_profiles (tenant_id, name, qci, max_bandwidth_mbps, latency_target_ms, packet_loss_pct)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'URLLC-Critical', 7, 300, 2, 0.1),
  ('11111111-0000-0000-0000-000000000001', 'eMBB-Standard', 9, 1000, 20, 1.5)
ON CONFLICT DO NOTHING;

INSERT INTO public.credit_balances (tenant_id, subscriber_id, balance_currency, balance_amount, last_recharged_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', 'USD', 625.50, NOW() - INTERVAL '3 days'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', 'USD', 210.00, NOW() - INTERVAL '8 days')
ON CONFLICT (tenant_id, subscriber_id) DO NOTHING;

INSERT INTO public.charging_sessions (tenant_id, subscriber_id, session_id, quota_allocated_mb, quota_used_mb, status, started_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 20480, 12450, 'active', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.cdr_records (tenant_id, subscriber_id, session_id, start_time, end_time, duration_seconds, bytes_uplink, bytes_downlink, charge_amount, charge_currency, rating_group)
VALUES
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 800000000, 1600000000, 12.75, 'USD', 'RG-IOT'),
  ('11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000002', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 3600, 700000000, 900000000, 7.30, 'USD', 'RG-EMBB')
ON CONFLICT DO NOTHING;

INSERT INTO public.performance_metrics (tenant_id, entity_type, entity_id, metric_name, metric_value, unit, recorded_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000001', 'latency_ms', 14.2, 'ms', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'throughput_mbps', 925.4, 'mbps', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'slice', '55555555-0000-0000-0000-000000000001', 'session_count', 412, 'count', NOW() - INTERVAL '2 minutes'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000002', 'cpu_pct', 48.1, 'percent', NOW() - INTERVAL '2 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.alerts (tenant_id, alert_name, severity, entity_type, entity_id, condition, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'AMF latency > 50ms', 'warning', 'network_function', '44444444-0000-0000-0000-000000000001', '{"metric":"latency_ms","op":">","value":50}', TRUE),
  ('11111111-0000-0000-0000-000000000001', 'UPF packet loss > 1%', 'critical', 'network_function', '44444444-0000-0000-0000-000000000003', '{"metric":"packet_loss_pct","op":">","value":1}', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.alarms (tenant_id, alarm_type, severity, source_entity_type, source_entity_id, description, status, raised_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'throughput_drop', 'warning', 'network_function', '44444444-0000-0000-0000-000000000003', 'UPF throughput dropped 18% in 5 min', 'active', NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.incidents (tenant_id, title, description, severity, status, alarm_ids)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Mumbai UPF congestion', 'Observed short-term packet loss increase in Mumbai zone.', 'major', 'investigating', '{}')
ON CONFLICT DO NOTHING;

INSERT INTO public.edge_clusters (id, tenant_id, name, region_id, status, node_count, kubernetes_version, last_heartbeat)
VALUES
  ('88888888-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Mumbai-Edge-Cluster-A', '22222222-0000-0000-0000-000000000001', 'online', 4, '1.30', NOW() - INTERVAL '30 seconds')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.edge_nodes (tenant_id, cluster_id, hostname, ip_address, status, cpu_cores, memory_gb)
VALUES
  ('11111111-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'edge-node-a1', '10.10.1.11', 'online', 16, 64),
  ('11111111-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'edge-node-a2', '10.10.1.12', 'online', 16, 64)
ON CONFLICT DO NOTHING;

INSERT INTO public.security_policies (tenant_id, name, policy_type, rules, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'API Rate Limit', 'api_security', '{"rpm":1200,"burst":200}', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.threat_alerts (tenant_id, threat_type, severity, description, metadata)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'auth_failure_spike', 'warning', 'Auth failures rose above baseline.', '{"window_min":5,"count":42}')
ON CONFLICT DO NOTHING;

INSERT INTO public.logs (tenant_id, entity_type, entity_id, severity, message, metadata, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000001', 'info', 'AMF registration success rate stable', '{"rate":99.93}', NOW() - INTERVAL '1 minute'),
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'warning', 'UPF packet queue depth elevated', '{"depth":1342}', NOW() - INTERVAL '2 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.traces (id, tenant_id, trace_name, root_service, status, started_at, ended_at, duration_ms)
VALUES
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Attach Session Flow', 'AMF', 'ok', NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '29.5 seconds', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trace_spans (tenant_id, trace_id, span_name, service_name, started_at, ended_at, duration_ms, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'AMF.Auth', 'AMF', NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '29.8 seconds', 200, 'ok'),
  ('11111111-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'SMF.SessionCreate', 'SMF', NOW() - INTERVAL '29.8 seconds', NOW() - INTERVAL '29.5 seconds', 300, 'ok')
ON CONFLICT DO NOTHING;

INSERT INTO public.orchestration_jobs (tenant_id, job_type, target_type, target_id, payload, status, created_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'deploy', 'network_function', '44444444-0000-0000-0000-000000000005', '{"helm_release":"udm-core"}', 'completed', NOW() - INTERVAL '2 days'),
  ('11111111-0000-0000-0000-000000000001', 'scale', 'network_function', '44444444-0000-0000-0000-000000000003', '{"replicas":3}', 'queued', NOW() - INTERVAL '8 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.marketplace_packages (id, vendor_id, name, description, package_type, category, version, helm_chart_url, container_image, is_verified, price_model, price_amount)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Edge Firewall CNF', 'Carrier-grade edge firewall package', 'CNF', 'security', '1.4.2', 'https://charts.example.com/edge-firewall', 'registry.example.com/edge/firewall:1.4.2', TRUE, 'subscription', 399),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'DNS Accelerator VNF', 'DNS performance accelerator for edge zones', 'VNF', 'performance', '2.1.0', 'https://charts.example.com/dns-accel', 'registry.example.com/dns/accel:2.1.0', TRUE, 'one-time', 999)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.marketplace_installs (tenant_id, package_id, status, installed_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'installed', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.gdpr_requests (tenant_id, requester_email, request_type, status, subscriber_id, created_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'privacy@example.com', 'access', 'pending', '66666666-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO public.compliance_reports (tenant_id, report_name, status, summary, generated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Monthly Regulatory Report', 'passed', '{"controls_checked":32,"exceptions":0}', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.regulatory_logs (tenant_id, event_type, description, metadata, occurred_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'lawful_intercept_audit', 'Quarterly LI audit completed.', '{"result":"pass"}', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.model_registry (id, tenant_id, model_name, model_type, version, artifact_url, metrics, status)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'LatencySpikeDetector', 'anomaly_detection', '1.0.3', 's3://models/latency-spike-1.0.3', '{"f1":0.91}', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'UPFFailurePredictor', 'predictive_maintenance', '0.9.4', 's3://models/upf-failure-0.9.4', '{"auc":0.88}', 'staging')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.anomaly_alerts (tenant_id, entity_type, entity_id, anomaly_type, severity, score, details, detected_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'network_function', '44444444-0000-0000-0000-000000000003', 'latency_spike', 'warning', 0.82, '{"baseline_ms":15,"observed_ms":38}', NOW() - INTERVAL '9 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_predictions (tenant_id, prediction_type, entity_type, entity_id, predicted_value, confidence, predicted_for, metadata)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'throughput_forecast_mbps', 'network_function', '44444444-0000-0000-0000-000000000003', 1100, 0.89, NOW() + INTERVAL '2 hours', '{"window":"2h"}')
ON CONFLICT DO NOTHING;

INSERT INTO public.optimization_recommendations (tenant_id, title, description, recommendation_type, target_type, target_id, payload, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Scale UPF by +1 replica', 'Predicted throughput increase at evening peak.', 'capacity_scale', 'network_function', '44444444-0000-0000-0000-000000000003', '{"replicas":4}', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_invites (tenant_id, email, role, invite_token, expires_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'engineer@example.com', 'network_engineer', 'demo-invite-token-001', NOW() + INTERVAL '6 days')
ON CONFLICT (invite_token) DO NOTHING;

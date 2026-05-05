#!/bin/sh
# This script writes the correct config and then launches the bridge binary.
# It bypasses the bug where the bridge ignores its mounted config file.

cat > /tmp/chirpstack-gateway-bridge.toml << 'EOF'
[backend.udp]
  bind = "0.0.0.0:1700"

[integration.mqtt]
  server = "tcp://mosquitto:1883"
  event_topic_template = "gateway/{{ .GatewayID }}/event/{{ .EventType }}"
  command_topic_template = "gateway/{{ .GatewayID }}/command/{{ .CommandType }}"
EOF

exec /usr/bin/chirpstack-gateway-bridge -c /tmp/chirpstack-gateway-bridge.toml

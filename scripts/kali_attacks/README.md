# Kali Linux Attack Testing Suite
## Cyber Defense System Validation

This directory contains attack simulation scripts for validating the Adaptive Network Defense System.

> ⚠️ **WARNING**: These scripts are for authorized security testing only. Only run them against systems you own or have explicit permission to test.

---

## Prerequisites

1. **Kali Linux VM** on the same network as the defense system
2. **Target IP**: The pfSense firewall or protected network
3. **Testing Window**: Coordinate with system administrators

## Attack Scenarios

### 1. Brute Force Attack (SSH)
Tests detection of credential stuffing attempts.

```bash
./attacks/brute_force_ssh.sh <TARGET_IP>
```

### 2. Port Scanning
Tests detection of reconnaissance activity.

```bash
./attacks/port_scan.sh <TARGET_IP>
```

### 3. DDoS Simulation
Tests detection of volumetric attacks (low volume for testing).

```bash
./attacks/ddos_simulation.sh <TARGET_IP>
```

### 4. Web Application Attacks
Tests detection of SQLi, XSS, and other web attacks.

```bash
./attacks/web_attacks.sh <TARGET_URL>
```

### 5. Full Attack Scenario
Runs all attacks in sequence with logging.

```bash
./run_full_test.sh <TARGET_IP> <DURATION_MINUTES>
```

---

## Expected Results

| Attack Type | Expected Detection | Response Time |
|------------|-------------------|---------------|
| Brute Force | IDS Alert + Anomaly | < 60 seconds |
| Port Scan | IDS Alert | < 30 seconds |
| DDoS | Traffic Anomaly | < 10 seconds |
| Web Attacks | IDS Alert | < 5 seconds |

---

## Validation Checklist

- [ ] Alerts appear in Grafana dashboard
- [ ] AI Insights page shows threat intelligence
- [ ] Automated block rules are suggested
- [ ] Audit log captures all events
- [ ] LLM provides threat explanations

---

## Log Collection

After testing, collect logs for analysis:

```bash
./collect_logs.sh <OUTPUT_DIR>
```

#!/bin/bash
echo "=== TEST MIGRATION DNS djamiyahgroup.com ==="

echo "\n1. IP domaine (doit être 76.76.21.21)"
dig djamiyahgroup.com A +short

echo "\n2. MX emails (doit contenir hostinger)"
dig djamiyahgroup.com MX +short

echo "\n3. SPF (doit contenir spf.hostinger)"
dig djamiyahgroup.com TXT +short | grep spf

echo "\n4. HTTPS site (doit retourner 200)"
curl -s -o /dev/null -w "%{http_code}" https://djamiyahgroup.com

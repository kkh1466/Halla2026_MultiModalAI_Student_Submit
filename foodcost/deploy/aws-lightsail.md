# AWS Lightsail 배포 메모

2일 정도 켰다 껐다 쓰는 용도라면 Lightsail Linux/Unix 인스턴스가 가장 단순합니다. 현재 앱은 SQLite를 쓰므로 별도 RDS 없이 한 서버 안에서 실행합니다.

## 1. Lightsail 생성

1. Region: `ap-northeast-2` 서울
2. Platform: Linux/Unix
3. Blueprint: Ubuntu
4. Plan: 최소 `$7/month` 권장, 여유 있게는 `$12/month`
5. Networking에서 HTTP 80, HTTPS 443, SSH 22 허용
6. 같은 주소로 계속 접속하려면 Static IP를 생성해서 인스턴스에 attach

## 2. 서버 초기 설정

로컬에서 이 파일들을 서버로 올립니다.

```bash
scp deploy/lightsail-setup.sh ubuntu@SERVER_IP:/tmp/lightsail-setup.sh
ssh ubuntu@SERVER_IP
chmod +x /tmp/lightsail-setup.sh
/tmp/lightsail-setup.sh
```

## 3. 앱 업로드

로컬에서 `node_modules`, `.next`를 제외하고 압축한 뒤 서버 `/opt/foodcost`로 업로드합니다.

PowerShell 예시:

```powershell
Compress-Archive -Path deploy,prisma,src,package.json,package-lock.json,next.config.mjs,postcss.config.mjs,tailwind.config.ts,tsconfig.json,.env.example -DestinationPath foodcost.zip -Force
scp foodcost.zip ubuntu@SERVER_IP:/tmp/foodcost.zip
```

서버에서:

```bash
cd /opt/foodcost
unzip -o /tmp/foodcost.zip
```

## 4. 환경변수 설정

서버에서 `.env`를 만듭니다.

```bash
cd /opt/foodcost
cp .env.example .env
nano .env
```

최소값:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://SERVER_IP"
NEXTAUTH_SECRET="길고-랜덤한-문자열"
OPENAI_API_KEY="..."
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

Google/Kakao 로그인을 안 쓰면 해당 값은 비워둬도 됩니다.

`NEXTAUTH_SECRET` 생성 예시:

```bash
openssl rand -base64 32
```

## 5. 설치/빌드/DB 준비

```bash
cd /opt/foodcost
npm ci
npx prisma generate
npx prisma db push
npm run seed:baekban
npm run build
sudo systemctl restart foodcost
sudo systemctl status foodcost
```

접속:

```text
http://SERVER_IP
```

## 6. 켜고 끄기

2일만 쓸 경우:

- AWS 콘솔에서 Lightsail 인스턴스 Stop/Start
- Static IP를 붙이지 않으면 Start 후 IP가 바뀔 수 있음
- 서버 안에서 앱만 재시작하려면:

```bash
sudo systemctl restart foodcost
```

로그 확인:

```bash
journalctl -u foodcost -f
```

## 7. 비용 주의

- 인스턴스를 Stop하면 컴퓨팅 비용은 줄지만, 디스크/Static IP 등은 조건에 따라 비용이 남을 수 있습니다.
- 2일만 쓸 거면 테스트 끝난 뒤 인스턴스, Static IP, 스냅샷까지 정리하세요.
- AWS Budget 알림을 `$30`, `$38` 정도로 걸어두는 것을 권장합니다.

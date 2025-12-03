pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        BACKEND_DIR = "backend"
        EC2_HOST = "98.80.218.98"
        CI = "false"
    }

    stages {

        /* ===========================
         * PREPARAR ENTORNO
         * =========================== */
        stage('Preparar entorno') {
            steps {
                echo "Instalando Node.js y Python en el agente Jenkins..."

                sh '''
                    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    node -v
                    npm -v

                    sudo apt-get update -y
                    sudo apt-get install -y python3 python3-pip
                    python3 --version
                    pip3 --version
                '''
            }
        }

        /* ===========================
         * CHECKOUT
         * =========================== */
        stage('Checkout') {
            steps {
                echo "Haciendo checkout del repositorio..."
                checkout scm
            }
        }

        /* ===========================
         * INSTALL DEPENDENCIES
         * =========================== */
        stage('Instalar dependencias') {
            steps {
                echo "Instalando dependencias..."

                dir("${BACKEND_DIR}") {
                    sh "npm install"
                }

                dir("${FRONTEND_DIR}") {
                    sh "npm install"
                }
            }
        }

        /* ===========================
         * TESTS
         * =========================== */
        stage("Pruebas Backend (Jest)") {
            steps {
                dir("${BACKEND_DIR}") {
                    sh "chmod +x node_modules/.bin/jest || true"
                    sh "npm test -- --watchAll=false"
                }
            }
        }

        stage("Pruebas Frontend (React)") {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh "CI=true npm test -- --watchAll=false || true"
                }
            }
        }

        /* ===========================
         * LINT
         * =========================== */
        stage('Lint') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh "npm run lint || true"
                }
                dir("${BACKEND_DIR}") {
                    sh "npm run lint || true"
                }
            }
        }

        /* ===========================
         * BUILD FRONTEND
         * =========================== */
        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh "npm run build"
                }
            }
        }

        /* ===========================
         * SECURITY TOOLS
         * =========================== */
        stage('Instalar Tools de Seguridad') {
            steps {
                sh '''
                    pip3 install --break-system-packages semgrep detect-secrets checkov || true
                '''
            }
        }

        stage('Security - npm audit') {
            steps {
                sh "npm audit --audit-level=high || true"
            }
        }

        stage('Security - Semgrep') {
            steps {
                sh "semgrep --config auto || true"
            }
        }

        stage('Security - Secret Scanning') {
            steps {
                sh '''
                    detect-secrets scan --all-files > detect-secrets-report.json || true
                    cat detect-secrets-report.json
                '''
            }
        }

        stage('Security - Checkov') {
            steps {
                sh "checkov -d . || true"
            }
        }

        /* ===========================
         * DEPLOY A AWS EC2
         * =========================== */
        stage('Deploy a AWS EC2') {
            steps {
                echo "Desplegando en AWS EC2 ${EC2_HOST}..."

                sshagent(credentials: ['ec2-jenkins-key']) {
                    sh """
ssh -o StrictHostKeyChecking=no ec2-user@${EC2_HOST} << 'EOF'

  echo ">> Entrando al proyecto..."
  cd DevOps_ProyectoFinal

  echo ">> Sincronizando repo..."
  git fetch origin main
  git reset --hard origin/main
  git clean -fd

  echo ">> Backend - instalando dependencias..."
  cd backend
  npm install

  echo ">> Reiniciando backend con PM2..."
  pm2 restart backend || pm2 start src/server.js --name backend
  pm2 save

  echo ">> Frontend - instalando dependencias..."
  cd ../frontend
  npm install
  npm run build

  echo ">> Sirviendo frontend..."
  pm2 restart frontend || pm2 start "npx serve -s dist -l 80" --name frontend
  pm2 save

  echo ">> DEPLOY COMPLETADO CON ÉXITO 🚀"
EOF
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completado exitosamente 🎉"
        }
        failure {
            echo "El pipeline falló ❌ Revisar logs"
        }
    }
}

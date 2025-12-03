pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        BACKEND_DIR = "backend"
        EC2_HOST = "98.80.218.98"
    }

    stages {

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
         * INSTALL NODE DEPENDENCIES
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
                    sh "npm test -- --watchAll=false || true"
                }
            }
        }

        stage("Pruebas Frontend (React Testing Library)") {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh "npm test -- --watchAll=false || true"
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
         * SECURITY SCANS
         * =========================== */
        stage('Security - npm audit') {
            steps {
                sh "npm audit --audit-level=high || true"
            }
        }

        stage('Security - Semgrep') {
            steps {
                sh """
                    pip3 install --user semgrep || true
                    python3 -m semgrep --config auto --error || true
                """
            }
        }

        stage('Security - Secret Scanning') {
            steps {
                sh """
                    pip3 install --user detect-secrets || true
                    detect-secrets scan --all-files > detect-secrets-report.json || true
                    cat detect-secrets-report.json || true
                """
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
        stage('Deploy to AWS EC2') {
            steps {
                echo "Desplegando en AWS EC2 ${EC2_HOST} ..."

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

  echo ">> Reiniciando con PM2..."
  pm2 restart backend || pm2 start index.js --name backend
  pm2 save

  echo ">> Frontend - instalando dependencias..."
  cd ../frontend
  npm install
  npm run build

  echo ">> Sirviendo el frontend..."
  cd dist
  pm2 restart frontend || pm2 start "npx serve -s . -l 80" --name frontend
  pm2 save

  echo ">> DEPLOY COMPLETADO"
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
            echo "El pipeline falló. Revisar logs ❌"
        }
    }
}

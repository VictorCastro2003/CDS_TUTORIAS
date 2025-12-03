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

                // Backend
                dir("${BACKEND_DIR}") {
                    sh "npm install"
                }

                // Frontend
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
                    sh "npm test -- --watchAll=false || true"
                }
            }
        }

        stage("Pruebas Frontend (React)") {
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
         * SECURITY TOOLS
         * =========================== */
        stage('Instalar Python + Tools de seguridad') {
            steps {
                script {
                    // Opción 1: Usar sudo (requiere configuración en Jenkins)
                    sh """
                        sudo apt update -y || true
                        sudo apt install -y python3 python3-pip || true
                        pip3 install --user semgrep detect-secrets checkov || true
                    """
                    
                    // Opción 2 (alternativa): Instalar solo para el usuario
                    // sh """
                    //     pip3 install --user semgrep detect-secrets checkov || true
                    // """
                }
            }
        }

        stage('Security - npm audit') {
            steps {
                echo "Ejecutando npm audit..."
                dir("${BACKEND_DIR}") {
                    sh "npm audit --audit-level=high || true"
                }
                dir("${FRONTEND_DIR}") {
                    sh "npm audit --audit-level=high || true"
                }
            }
        }

        stage('Security - Semgrep') {
            steps {
                echo "Ejecutando análisis con Semgrep..."
                sh """
                    export PATH=\$PATH:\$HOME/.local/bin
                    semgrep --config auto --json --output semgrep-report.json || true
                    cat semgrep-report.json || true
                """
            }
        }

        stage('Security - Secret Scanning') {
            steps {
                echo "Escaneando secretos con detect-secrets..."
                sh """
                    export PATH=\$PATH:\$HOME/.local/bin
                    detect-secrets scan --all-files > detect-secrets-report.json || true
                    cat detect-secrets-report.json
                """
            }
        }

        stage('Security - Checkov') {
            steps {
                echo "Ejecutando análisis con Checkov..."
                sh """
                    export PATH=\$PATH:\$HOME/.local/bin
                    checkov -d . --output json --output-file checkov-report.json || true
                    cat checkov-report.json || true
                """
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
            echo "✅ Pipeline completado exitosamente 🎉"
            // Opcional: archivar reportes
            archiveArtifacts artifacts: '*-report.json', allowEmptyArchive: true
        }
        failure { 
            echo "❌ El pipeline falló. Revisar logs"
        }
        always {
            echo "🔍 Limpiando workspace..."
            cleanWs()
        }
    }
}
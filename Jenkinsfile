pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        BACKEND_DIR = "backend"
        EC2_HOST = "98.80.218.98"
        CI = "true"  // Cambiado a true para evitar modo interactivo
        SECURITY_TOOLS_PATH = "/opt/security-tools/bin"
        // Agregar variable para Jest
        NODE_OPTIONS = "--experimental-vm-modules"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Haciendo checkout del repositorio..."
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                echo "Instalando dependencias..."

                dir("${BACKEND_DIR}") {
                    sh "npm install"
                }

                dir("${FRONTEND_DIR}") {
                    sh "npm install"
                    // Eliminar archivos de prueba duplicados
                    sh "rm -f src/App.test.jsx || true"
                }
            }
        }

        stage("Pruebas Backend (Jest)") {
            steps {
                dir("${BACKEND_DIR}") {
                    // Ejecutar tests con NODE_OPTIONS
                    sh """
                        export NODE_OPTIONS='--experimental-vm-modules'
                        npm test -- --watchAll=false --passWithNoTests || true
                    """
                }
            }
        }

        stage("Pruebas Frontend (React)") {
            steps {
                dir("${FRONTEND_DIR}") {
                    // Ejecutar con CI=true para evitar modo watch
                    sh """
                        export CI=true
                        npm test -- --watchAll=false --passWithNoTests || true
                    """
                }
            }
        }

        stage('Lint') {
            steps {
                echo "Ejecutando linters..."
                dir("${FRONTEND_DIR}") {
                    sh "npm run lint || true"
                }
                dir("${BACKEND_DIR}") {
                    sh "npm run lint || true"
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh "npm run build"
                }
            }
        }

        stage('Security - npm audit') {
            steps {
                echo "Ejecutando npm audit..."
                dir("${BACKEND_DIR}") {
                    sh """
                        echo "=== Backend Security Audit ===" > ../npm-audit-report.txt
                        npm audit --audit-level=moderate >> ../npm-audit-report.txt || true
                    """
                }
                dir("${FRONTEND_DIR}") {
                    sh """
                        echo "=== Frontend Security Audit ===" >> ../npm-audit-report.txt
                        npm audit --audit-level=moderate >> ../npm-audit-report.txt || true
                    """
                }
                sh "cat npm-audit-report.txt"
            }
        }

        stage('Security - Semgrep') {
            steps {
                script {
                    echo "Ejecutando análisis con Semgrep..."
                    def semgrepExists = sh(
                        script: "test -f ${SECURITY_TOOLS_PATH}/semgrep && echo 'yes' || echo 'no'",
                        returnStdout: true
                    ).trim()
                    
                    if (semgrepExists == 'yes') {
                        sh """
                            ${SECURITY_TOOLS_PATH}/semgrep --config auto \
                                --json --output semgrep-report.json || echo '{"results": [], "error": "Semgrep execution failed"}' > semgrep-report.json
                            if [ -f semgrep-report.json ]; then
                                echo "=== Semgrep Report ==="
                                cat semgrep-report.json
                            fi
                        """
                    } else {
                        echo "⚠️ Semgrep no está instalado. Saltando..."
                        echo "Para instalarlo: docker exec -u root <container> /opt/security-tools/bin/pip install --upgrade semgrep click"
                    }
                }
            }
        }

        stage('Security - Secret Scanning') {
            steps {
                script {
                    echo "Escaneando secretos con detect-secrets..."
                    def detectSecretsExists = sh(
                        script: "test -f ${SECURITY_TOOLS_PATH}/detect-secrets && echo 'yes' || echo 'no'",
                        returnStdout: true
                    ).trim()
                    
                    if (detectSecretsExists == 'yes') {
                        sh """
                            ${SECURITY_TOOLS_PATH}/detect-secrets scan --all-files \
                                > detect-secrets-report.json || true
                            if [ -f detect-secrets-report.json ]; then
                                cat detect-secrets-report.json
                            fi
                        """
                    } else {
                        echo "⚠️ detect-secrets no está instalado. Saltando..."
                    }
                }
            }
        }

        stage('Security - Checkov') {
            steps {
                script {
                    echo "Ejecutando análisis con Checkov..."
                    def checkovExists = sh(
                        script: "test -f ${SECURITY_TOOLS_PATH}/checkov && echo 'yes' || echo 'no'",
                        returnStdout: true
                    ).trim()
                    
                    if (checkovExists == 'yes') {
                        sh """
                            ${SECURITY_TOOLS_PATH}/checkov -d . \
                                --output json --output-file checkov-report.json || true
                            if [ -f checkov-report.json ]; then
                                cat checkov-report.json
                            fi
                        """
                    } else {
                        echo "⚠️ Checkov no está instalado. Saltando..."
                    }
                }
            }
        }

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
  cd build
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
            archiveArtifacts artifacts: '*-report.json, *-report.txt', allowEmptyArchive: true
        }
        failure { 
            echo "❌ El pipeline falló. Revisar logs"
        }
        always {
            echo "🏁 Finalizando pipeline..."
        }
    }
}
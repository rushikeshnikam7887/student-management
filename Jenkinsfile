import org.jenkinsci.plugins.workflow.steps.FlowInterruptedException

pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Scan') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                trivy image \
                    --severity CRITICAL \
                    --exit-code 1 \
                    --format table \
                    --output trivy-report.txt \
                    student-management-app

                echo "================ Trivy Report ================"
                cat trivy-report.txt
                '''
            }
        }

        stage('Deploy Test') {
            steps {
                sh '''
                docker rm -f student-test || true

                docker run -d \
                    --name student-test \
                    -p 8081:3000 \
                    student-management-app
                '''
            }
        }

        stage('OWASP ZAP Scan') {
            steps {
                sh '''
                mkdir -p reports
                chmod -R 777 reports
        
                docker run --rm \
                    --network host \
                    -v $(pwd)/reports:/zap/wrk \
                    ghcr.io/zaproxy/zaproxy:stable \
                    zap-baseline.py \
                    -t http://localhost:8081 \
                    -r zap-report.html \
                    -x zap-report.xml
                '''
            }
        }

        stage('ZAP Security Gate') {
            steps {
                script {

                    def highAlerts = sh(
                        script: '''
                        grep -o "<riskcode>3</riskcode>" reports/zap-report.xml | wc -l
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "High Alerts = ${highAlerts}"

                    if (highAlerts != "0") {
                        error("High Risk Vulnerabilities Found by OWASP ZAP")
                    }
                }
            }
        }

        stage('Cleanup Test') {
            steps {
                sh 'docker rm -f student-test || true'
            }
        }

        stage('Deploy Production') {
            steps {
                sh '''
                docker rm -f student-management || true

                docker run -d \
                    --name student-management \
                    -p 3000:3000 \
                    student-management-app
                '''
            }
        }

        stage('Verify') {
            steps {
                sh 'docker ps'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '''
                trivy-report.txt,
                reports/zap-report.html,
                reports/zap-report.xml
            ''', fingerprint: true
        }
    }
}

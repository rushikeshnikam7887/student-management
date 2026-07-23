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
                script {
                    sh '''
                    trivy image \
                        --ignorefile .trivyignore \
                        --severity CRITICAL \
                        --exit-code 1 \
                        --format table \
                        --output trivy-report.txt \
                        student-management-app
        
                    echo "========== Trivy Report =========="
                    cat trivy-report.txt
                    '''
                }
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
                script {
                    sh(
                        script: '''
                        mkdir -p reports
        
                        docker run --rm \
                            --network host \
                            -v $(pwd)/reports:/zap/wrk \
                            ghcr.io/zaproxy/zaproxy:stable \
                            zap-baseline.py \
                            -t http://localhost:8081 \
                            -r zap-report.html \
                            -x zap-report.xml \
                            -I
                        ''',
                        returnStatus: true
                    )
                }
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

        stage('Push Docker Hub') {

            steps {
        
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
        
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                    docker tag student-management-app 7887769418/student-management:${BUILD_NUMBER}
                    docker tag student-management-app 7887769418/student-management:latest
        
                    docker push 7887769418/student-management:${BUILD_NUMBER}
                    docker push 7887769418/student-management:latest
        
                    docker logout
                    '''
        
                }
        
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

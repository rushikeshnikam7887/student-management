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
					
					echo "====********========== Trivy Report ==========*******========"
					cat trivy-report.txt               
				 '''
            }
        }

        stage('Deploy test') {
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
                reports/*
            ''', fingerprint: true
        }
    }
}

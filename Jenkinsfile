pipeline {
    agent any

    environment {
        IMAGE_NAME = "srri/smart-cold-chain-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build React') {
            steps {
                bat '''
                    cd frontend
                    npm install
                    npm run build
                '''
            }
        }

        stage('Docker Build') {
            steps {
                bat '''
                    docker build -t %IMAGE_NAME%:%BUILD_NUMBER% frontend
                    docker tag %IMAGE_NAME%:%BUILD_NUMBER% %IMAGE_NAME%:latest
                '''
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-jenkins-test',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    bat '''
                        echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USER% --password-stdin
                        docker push %IMAGE_NAME%:%BUILD_NUMBER%
                        docker push %IMAGE_NAME%:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                    kubectl apply -f frontend\\deployment.yaml
                    kubectl apply -f frontend\\service.yaml
                    kubectl set image deployment/smart-cold-chain-frontend frontend=%IMAGE_NAME%:%BUILD_NUMBER%
                '''
            }
        }

    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully!'
        }
        failure {
            echo 'CI/CD pipeline failed.'
        }
    }
}


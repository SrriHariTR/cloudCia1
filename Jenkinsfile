pipeline {
    agent any

    environment {
        IMAGE_NAME = "smart-cold-chain-frontend"
        KUBECONFIG = "C:\\Users\\ramku\\.kube\\config"
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

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                    kubectl config use-context docker-desktop

                    kubectl apply -f frontend\\deployment.yaml --validate=false
                    kubectl apply -f frontend\\service.yaml --validate=false

                    kubectl set image deployment/smart-cold-chain-frontend frontend=%IMAGE_NAME%:%BUILD_NUMBER%

                    kubectl rollout status deployment/smart-cold-chain-frontend
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
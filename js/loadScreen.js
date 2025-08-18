
        // Pasos de carga con textos personalizados
        const loadingSteps = [
            { text: "Inicializando sistema...", progress: 15 },
            { text: "Conectando a la base de datos...", progress: 35 },
            { text: "Cargando datos del inventario...", progress: 55 },
            { text: "Procesando información...", progress: 75 },
            { text: "Configurando interfaz...", progress: 90 },
            { text: "Finalizando carga...", progress: 100 }
        ];

        // Función principal de carga
        async function showLoadingScreen() {
            const loadingText = document.getElementById('loadingText');
            const progressBar = document.getElementById('progressBar');
            
            // Ejecutar pasos de carga
            for (let i = 0; i < loadingSteps.length; i++) {
                const step = loadingSteps[i];
                loadingText.textContent = step.text;
                progressBar.style.width = step.progress + '%';
                
                // Tiempo de espera realista entre pasos
                await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 600));
            }

            // Ocultar pantalla de carga y mostrar contenido
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('mainContent').classList.add('loaded');
                
                // Remover pantalla de carga del DOM después de la animación
                setTimeout(() => {
                    document.getElementById('loadingScreen').remove();
                }, 500);
            }, 300);
        }

        // Animación de los puntos de carga
        function animateLoadingDots() {
            const dots = document.querySelectorAll('.loading-dots span');
            let current = 0;
            
            const interval = setInterval(() => {
                dots.forEach((dot, index) => {
                    dot.style.opacity = index === current ? '1' : '0.3';
                });
                current = (current + 1) % dots.length;
                
                // Detener cuando se oculte la pantalla de carga
                if (document.getElementById('loadingScreen')?.classList.contains('hidden')) {
                    clearInterval(interval);
                }
            }, 500);
        }

        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', function() {
            // Iniciar animación de puntos
            animateLoadingDots();
            
            // Iniciar proceso de carga
            showLoadingScreen();
        });
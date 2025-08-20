from simple_pid import PID

class StimulusController:
    def __init__(self, target_rate=0.5):
        self.pid = PID(kp=2.0, ki=0.1, kd=0.05, setpoint=target_rate)
        self.pid.output_limits = (0.0, 1.0)

    def compute(self, neural_rate):
        control_signal = self.pid(neural_rate)
        # Map control signal to GAN latent parameter scaling here
        return control_signal

    def update(self, measured_rate):
        return self.compute(measured_rate)

if __name__ == "__main__":
    import time, random
    controller = StimulusController()
    for _ in range(10):
        measured = random.uniform(0, 1)
        control = controller.update(measured)
        print(f"Measured: {measured:.3f} -> Control: {control:.3f}")
        time.sleep(1)
import wave
import struct
import math

# Audio configuration
SAMPLE_RATE = 44100
DURATION = 0.05

# Create a short wooden "tick" sound
start_freq = 2000
end_freq = 500

num_samples = int(SAMPLE_RATE * DURATION)
audio_data = bytearray()

for i in range(num_samples):
    t = float(i) / SAMPLE_RATE
    
    # Very fast exponential decay for frequency (pitch envelope)
    freq = start_freq * math.pow(end_freq / start_freq, t / DURATION)
    
    # Very sharp ADSR Envelope for a "click"
    if t < 0.002:
        envelope = t / 0.002
    else:
        envelope = math.exp(-100 * (t - 0.002))
        
    value = math.sin(2 * math.pi * freq * t) * envelope
    
    # Convert to 16-bit PCM
    sample = int(value * 32767)
    audio_data.extend(struct.pack('<h', sample))

# Write WAV file
with wave.open('assets/click.wav', 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2) # 16-bit
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(audio_data)

print("Generated click sound successfully!")

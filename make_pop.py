import wave
import struct
import math

# Audio configuration
SAMPLE_RATE = 44100
DURATION = 0.15

# Create a pop/bubble sound
# Frequency sweep from low to high to give a "plop" effect
start_freq = 400
end_freq = 1200

num_samples = int(SAMPLE_RATE * DURATION)
audio_data = bytearray()

for i in range(num_samples):
    t = float(i) / SAMPLE_RATE
    
    # Exponential frequency sweep
    freq = start_freq * math.pow(end_freq / start_freq, t / DURATION)
    
    # ADSR Envelope
    # Quick attack, exponential decay
    attack_time = 0.01
    if t < attack_time:
        envelope = t / attack_time
    else:
        envelope = math.exp(-15 * (t - attack_time))
        
    value = math.sin(2 * math.pi * freq * t) * envelope
    
    # Soft clipping to make it sound a bit warmer
    value = max(-0.9, min(0.9, value))
    
    # Convert to 16-bit PCM
    sample = int(value * 32767)
    audio_data.extend(struct.pack('<h', sample))

# Write WAV file
with wave.open('assets/clear.wav', 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2) # 16-bit
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(audio_data)

print("Generated pop sound successfully!")

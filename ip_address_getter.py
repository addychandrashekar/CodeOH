import socket


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()

        return ip
    except Exception as e:
        print(f"Error occurred: {e}")
        return None

local_ip = get_local_ip()
print(f"Local IP Address: {local_ip}")
